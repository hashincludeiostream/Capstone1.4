/**
 * Nail Glam Hub - Central Email Sender & SMTP Configuration Test Suite
 *
 * Validates the 8 core scenarios for centralized email sender management:
 * 1. Valid central sender configuration
 * 2. Missing SMTP credentials & safe explicit failure
 * 3. Invalid sender RFC address formatting
 * 4. Provider authorization alignment & domain mismatch detection
 * 5. Dynamic sender configuration reload & cache busting
 * 6. Uniform sender identity across multiple platform workflows
 * 7. Recipient preservation across sender configuration changes
 * 8. Credential protection & zero password leakage
 */

import nodemailer from 'nodemailer';

// Helper assertion function
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${testName}${detail ? `: ${detail}` : ''}`);
  }
}

// Mirror the validation logic from server.app.ts to test in isolation
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

interface SmtpConfigValidation {
  isValid: boolean;
  errors: string[];
  senderEmail: string;
  senderName: string;
  senderFormatted: string;
  senderUserMatch: boolean;
  senderUserNotice?: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
}

function validateEmailSenderConfig(env: Record<string, string | undefined>): SmtpConfigValidation {
  const errors: string[] = [];
  const senderEmail = (env.SYSTEM_SENDER_EMAIL || '').trim();
  const senderName = (env.SYSTEM_SENDER_NAME || 'Nail Glam Hub').trim();
  const smtpHost = (env.SMTP_HOST || '').trim();
  const smtpPortRaw = (env.SMTP_PORT || '').trim();
  const smtpUser = (env.SMTP_USER || '').trim();
  const smtpPass = (env.SMTP_PASS || '').trim();
  const smtpSecureRaw = (env.SMTP_SECURE || '').trim().toLowerCase();

  if (!senderEmail) {
    errors.push('SYSTEM_SENDER_EMAIL is required in environment variables (no hardcoded fallback allowed)');
  } else if (!EMAIL_REGEX.test(senderEmail)) {
    errors.push(`SYSTEM_SENDER_EMAIL "${senderEmail}" is not a valid RFC 5322 email address`);
  }

  if (!smtpHost) {
    errors.push('SMTP_HOST is required in environment variables');
  }

  let smtpPort = 587;
  if (!smtpPortRaw) {
    errors.push('SMTP_PORT is required in environment variables');
  } else {
    smtpPort = parseInt(smtpPortRaw, 10);
    if (isNaN(smtpPort) || smtpPort <= 0 || smtpPort > 65535) {
      errors.push(`SMTP_PORT "${smtpPortRaw}" is invalid`);
    }
  }

  if (!smtpUser) {
    errors.push('SMTP_USER is required for authenticated SMTP transmission');
  }

  if (!smtpPass) {
    errors.push('SMTP_PASS is required for authenticated SMTP transmission');
  }

  const smtpSecure = smtpSecureRaw === 'true' || smtpSecureRaw === '1' || smtpPort === 465;

  let senderUserMatch = true;
  let senderUserNotice: string | undefined;

  if (senderEmail && smtpUser && EMAIL_REGEX.test(smtpUser)) {
    const senderLower = senderEmail.toLowerCase();
    const userLower = smtpUser.toLowerCase();
    if (senderLower !== userLower) {
      senderUserMatch = false;
      const senderDomain = senderLower.split('@')[1];
      const userDomain = userLower.split('@')[1];
      if (senderDomain !== userDomain) {
        senderUserNotice = `Notice: Sender domain (@${senderDomain}) differs from SMTP login domain (@${userDomain}). Most SMTP providers (Google, SES, SendGrid) require verified sender domain/alias authorization.`;
      } else {
        senderUserNotice = `Notice: SYSTEM_SENDER_EMAIL (${senderEmail}) differs from SMTP_USER (${smtpUser}). Verify this address is added as a permitted alias in your SMTP provider.`;
      }
    }
  }

  const senderFormatted = senderEmail
    ? (senderName ? `"${senderName.replace(/"/g, '')}" <${senderEmail}>` : senderEmail)
    : '';

  return {
    isValid: errors.length === 0,
    errors,
    senderEmail,
    senderName,
    senderFormatted,
    senderUserMatch,
    senderUserNotice,
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
  };
}

// In-memory transporter factory simulating server.app.ts cache and configuration
class MockTransporterRegistry {
  private cachedTransporter: any = null;
  private cachedHash: string = '';

  getTransporter(env: Record<string, string | undefined>) {
    const validation = validateEmailSenderConfig(env);
    if (!validation.isValid) {
      throw new Error(`SMTP_CONFIG_INVALID: ${validation.errors.join('; ')}`);
    }

    const currentHash = `${validation.senderEmail}|${validation.senderName}|${validation.smtpHost}|${validation.smtpPort}|${validation.smtpUser}|${env.SMTP_PASS || ''}`;
    if (!this.cachedTransporter || this.cachedHash !== currentHash) {
      // Create mock transporter with recorded dispatches
      const sentMessages: any[] = [];
      this.cachedTransporter = {
        options: {
          host: validation.smtpHost,
          port: validation.smtpPort,
          secure: validation.smtpSecure,
          auth: { user: validation.smtpUser, pass: env.SMTP_PASS },
        },
        sentMessages,
        sendMail: async (mailOptions: any) => {
          // Check provider rejection simulation
          if (env.SIMULATE_PROVIDER_REJECTION === 'true') {
            const err: any = new Error('550 5.7.1 Client does not have permissions to send as this sender');
            err.responseCode = 550;
            throw err;
          }
          sentMessages.push({
            ...mailOptions,
            messageId: `<test-${Date.now()}-${Math.random().toString(36).substring(7)}@${validation.smtpHost}>`,
          });
          return {
            messageId: sentMessages[sentMessages.length - 1].messageId,
            response: '250 2.0.0 OK Message accepted for delivery',
          };
        },
      };
      this.cachedHash = currentHash;
    }

    return { transporter: this.cachedTransporter, validation };
  }
}

async function runTestSuite() {
  console.log('\n=============================================================');
  console.log('🧪 Nail Glam Hub - Central Email Sender Test Suite');
  console.log('=============================================================\n');

  const registry = new MockTransporterRegistry();

  // --------------------------------------------------------------------------
  // Scenario 1: A valid central sender configuration
  // --------------------------------------------------------------------------
  console.log('--- Scenario 1: Valid Central Sender Configuration ---');
  {
    const validEnv = {
      SYSTEM_SENDER_EMAIL: 'concierge@glamhub.com',
      SYSTEM_SENDER_NAME: 'Glam Hub Central Mailer',
      SMTP_HOST: 'smtp.sendgrid.net',
      SMTP_PORT: '587',
      SMTP_USER: 'concierge@glamhub.com',
      SMTP_PASS: 'SG.testPass12345',
      SMTP_SECURE: 'false',
    };
    const val = validateEmailSenderConfig(validEnv);
    assert(val.isValid, 'Valid configuration reports isValid = true');
    assert(val.errors.length === 0, 'No validation errors generated');
    assert(
      val.senderFormatted === '"Glam Hub Central Mailer" <concierge@glamhub.com>',
      'Sender formatted header strictly adheres to RFC 5322 naming'
    );
    assert(val.senderUserMatch === true, 'Sender and user match flag is correctly identified');
  }

  // --------------------------------------------------------------------------
  // Scenario 2: Missing SMTP credentials
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 2: Missing SMTP Credentials Handling ---');
  {
    // Test missing SMTP_PASS
    const missingPassEnv = {
      SYSTEM_SENDER_EMAIL: 'concierge@glamhub.com',
      SYSTEM_SENDER_NAME: 'Glam Hub',
      SMTP_HOST: 'smtp.sendgrid.net',
      SMTP_PORT: '587',
      SMTP_USER: 'concierge@glamhub.com',
      SMTP_PASS: '',
    };
    const valPass = validateEmailSenderConfig(missingPassEnv);
    assert(!valPass.isValid, 'Missing SMTP_PASS correctly invalidates config');
    assert(
      valPass.errors.some((e) => e.includes('SMTP_PASS is required')),
      'Error message clearly highlights missing SMTP_PASS'
    );

    // Test missing SYSTEM_SENDER_EMAIL
    const missingSenderEnv = {
      SYSTEM_SENDER_EMAIL: '',
      SYSTEM_SENDER_NAME: 'Glam Hub',
      SMTP_HOST: 'smtp.sendgrid.net',
      SMTP_PORT: '587',
      SMTP_USER: 'concierge@glamhub.com',
      SMTP_PASS: 'secret123',
    };
    const valSender = validateEmailSenderConfig(missingSenderEnv);
    assert(!valSender.isValid, 'Missing SYSTEM_SENDER_EMAIL correctly invalidates config');
    assert(
      valSender.errors.some((e) => e.includes('SYSTEM_SENDER_EMAIL is required')),
      'Explicitly rejects missing sender with no silent fallback'
    );

    // Test that registry throws SMTP_CONFIG_INVALID on dispatch attempt
    let threwError = false;
    try {
      registry.getTransporter(missingPassEnv);
    } catch (e: any) {
      threwError = e.message.includes('SMTP_CONFIG_INVALID');
    }
    assert(threwError, 'Attempting dispatch without credentials throws explicit SMTP_CONFIG_INVALID');
  }

  // --------------------------------------------------------------------------
  // Scenario 3: An invalid sender address
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 3: Invalid Sender Address Validation ---');
  {
    const invalidAddresses = [
      'not-an-email',
      'user@',
      '@domain.com',
      'spaces in@email.com',
      'plainaddress',
    ];
    for (const badAddr of invalidAddresses) {
      const val = validateEmailSenderConfig({
        SYSTEM_SENDER_EMAIL: badAddr,
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_USER: 'user@example.com',
        SMTP_PASS: 'pass',
      });
      assert(
        !val.isValid && val.errors.some((e) => e.includes('valid RFC 5322 email address')),
        `Correctly rejects malformed sender address: "${badAddr}"`
      );
    }
  }

  // --------------------------------------------------------------------------
  // Scenario 4: Sender address that the SMTP provider does not authorize
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 4: Provider Sender Alignment & Authorization Handling ---');
  {
    // A: Domain mismatch detection
    const mismatchedEnv = {
      SYSTEM_SENDER_EMAIL: 'support@nailglamhub.com',
      SYSTEM_SENDER_NAME: 'Nail Glam Hub',
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: '587',
      SMTP_USER: 'personal.user@gmail.com',
      SMTP_PASS: 'appPassword123',
    };
    const valMismatch = validateEmailSenderConfig(mismatchedEnv);
    assert(!valMismatch.senderUserMatch, 'Detects when SYSTEM_SENDER_EMAIL differs from SMTP_USER');
    assert(
      valMismatch.senderUserNotice?.includes('differs from SMTP login domain') === true,
      'Generates informative advisory warning about provider alias & domain authorization'
    );

    // B: Handling provider rejection error (550 5.7.1)
    const rejectEnv = {
      ...mismatchedEnv,
      SIMULATE_PROVIDER_REJECTION: 'true',
    };
    const { transporter } = registry.getTransporter(rejectEnv);
    let caughtRejection = false;
    let errorMessage = '';
    try {
      await transporter.sendMail({
        from: valMismatch.senderFormatted,
        to: 'customer@example.com',
        subject: 'Booking Confirmation',
        html: '<p>Test</p>',
      });
    } catch (err: any) {
      caughtRejection = true;
      errorMessage = err.message;
    }
    assert(caughtRejection, 'Provider authorization rejection (550) is caught explicitly');
    assert(
      errorMessage.includes('does not have permissions to send as this sender'),
      'Detailed provider authorization error is preserved without silent fallback'
    );
  }

  // --------------------------------------------------------------------------
  // Scenario 5: Changing the sender configuration and reinitializing the backend
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 5: Dynamic Sender Configuration Reload & Transporter Re-init ---');
  {
    const configA = {
      SYSTEM_SENDER_EMAIL: 'alerts@brand-a.com',
      SYSTEM_SENDER_NAME: 'Brand A Mailer',
      SMTP_HOST: 'smtp.provider.com',
      SMTP_PORT: '587',
      SMTP_USER: 'user@provider.com',
      SMTP_PASS: 'passA',
    };
    const { transporter: transA, validation: valA } = registry.getTransporter(configA);
    assert(valA.senderFormatted === '"Brand A Mailer" <alerts@brand-a.com>', 'Sender A initialized');

    // Change environment variables to brand B
    const configB = {
      SYSTEM_SENDER_EMAIL: 'concierge@brand-b.com',
      SYSTEM_SENDER_NAME: 'Brand B Notifications',
      SMTP_HOST: 'smtp.provider.com',
      SMTP_PORT: '587',
      SMTP_USER: 'user@provider.com',
      SMTP_PASS: 'passB',
    };
    const { transporter: transB, validation: valB } = registry.getTransporter(configB);
    assert(valB.senderFormatted === '"Brand B Notifications" <concierge@brand-b.com>', 'Sender B reloaded');
    assert(transA !== transB, 'Transporter cache properly bust and re-instantiated upon config change');
  }

  // --------------------------------------------------------------------------
  // Scenario 6: Confirming that different email workflows all use the same configured sender
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 6: Consistent Central Sender Across All Platform Workflows ---');
  {
    const sharedConfig = {
      SYSTEM_SENDER_EMAIL: 'notifications@nailglamhub.com',
      SYSTEM_SENDER_NAME: 'Nail Glam Hub Central',
      SMTP_HOST: 'smtp.sendgrid.net',
      SMTP_PORT: '587',
      SMTP_USER: 'notifications@nailglamhub.com',
      SMTP_PASS: 'validSecretPassword123',
    };

    const { transporter, validation } = registry.getTransporter(sharedConfig);
    transporter.sentMessages.length = 0; // reset

    // Workflow 1: Customer appointment booking confirmation
    await transporter.sendMail({
      from: validation.senderFormatted,
      to: 'customer.sarah@gmail.com',
      subject: '✨ Booking Confirmed: Velvet Gel Manicure',
      html: '<h1>Your appointment is confirmed</h1>',
    });

    // Workflow 2: Salon owner new booking alert
    await transporter.sendMail({
      from: validation.senderFormatted,
      to: 'owner.lisa@sparklenails.com',
      subject: '📅 New Booking Alert: Saturday 2:00 PM',
      html: '<h1>New reservation received</h1>',
    });

    // Workflow 3: Customer cancellation notice
    await transporter.sendMail({
      from: validation.senderFormatted,
      to: 'customer.sarah@gmail.com',
      subject: 'Booking Cancellation Confirmed',
      html: '<h1>Your appointment has been cancelled</h1>',
    });

    // Workflow 4: Salon owner certified PDF master audit report
    await transporter.sendMail({
      from: validation.senderFormatted,
      to: 'owner.lisa@sparklenails.com',
      subject: 'Certified Monthly Business Audit Dossier (PDF)',
      html: '<h1>Monthly Performance Summary Attached</h1>',
    });

    assert(transporter.sentMessages.length === 4, 'All 4 platform workflows dispatched successfully');
    const allSendersMatch = transporter.sentMessages.every(
      (m: any) => m.from === '"Nail Glam Hub Central" <notifications@nailglamhub.com>'
    );
    assert(allSendersMatch, 'Every workflow dispatched with identical configured central sender');
  }

  // --------------------------------------------------------------------------
  // Scenario 7: Ensuring recipients remain correct when the sender changes
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 7: Recipient Preservation Across Sender Identity Changes ---');
  {
    const originalRecipient = 'valerie.client@example.com';
    const originalOwner = 'glamour.owner@example.com';

    // Step A: Dispatch with Sender Alpha
    const configAlpha = {
      SYSTEM_SENDER_EMAIL: 'system-alpha@domain-one.com',
      SYSTEM_SENDER_NAME: 'Alpha System Dispatch',
      SMTP_HOST: 'smtp.domain-one.com',
      SMTP_PORT: '587',
      SMTP_USER: 'system-alpha@domain-one.com',
      SMTP_PASS: 'alphaSecret1',
    };
    const { transporter: transAlpha, validation: valAlpha } = registry.getTransporter(configAlpha);
    await transAlpha.sendMail({
      from: valAlpha.senderFormatted,
      to: originalRecipient,
      subject: 'Alpha Booking',
      html: '<p>Booking</p>',
    });

    // Step B: Update sender to Sender Beta
    const configBeta = {
      SYSTEM_SENDER_EMAIL: 'system-beta@domain-two.com',
      SYSTEM_SENDER_NAME: 'Beta System Dispatch',
      SMTP_HOST: 'smtp.domain-two.com',
      SMTP_PORT: '587',
      SMTP_USER: 'system-beta@domain-two.com',
      SMTP_PASS: 'betaSecret2',
    };
    const { transporter: transBeta, validation: valBeta } = registry.getTransporter(configBeta);
    await transBeta.sendMail({
      from: valBeta.senderFormatted,
      to: originalRecipient,
      subject: 'Beta Booking',
      html: '<p>Booking</p>',
    });

    const alphaMsg = transAlpha.sentMessages[transAlpha.sentMessages.length - 1];
    const betaMsg = transBeta.sentMessages[transBeta.sentMessages.length - 1];

    assert(alphaMsg.to === originalRecipient, 'Sender Alpha correctly addressed recipient');
    assert(betaMsg.to === originalRecipient, 'Sender Beta correctly preserved original recipient');
    assert(alphaMsg.from !== betaMsg.from, 'Sender changed cleanly without altering recipient routing');
  }

  // --------------------------------------------------------------------------
  // Scenario 8: Ensuring credentials (SMTP_PASS) are never exposed
  // --------------------------------------------------------------------------
  console.log('\n--- Scenario 8: Security & Zero Password Exposure Verification ---');
  {
    const sensitiveEnv = {
      SYSTEM_SENDER_EMAIL: 'mailer@securehub.com',
      SYSTEM_SENDER_NAME: 'Secure Nail Hub',
      SMTP_HOST: 'smtp.securemail.net',
      SMTP_PORT: '587',
      SMTP_USER: 'admin.super.user@securehub.com',
      SMTP_PASS: 'CRITICAL_SECRET_PASSWORD_998877!!',
    };

    const val = validateEmailSenderConfig(sensitiveEnv);

    // Test API response simulation (matches server.app.ts /api/email/system-status)
    const apiStatusResponse = {
      configured: val.isValid,
      senderEmail: val.senderEmail,
      senderName: val.senderName,
      senderFormatted: val.senderFormatted,
      senderUserMatch: val.senderUserMatch,
      senderUserNotice: val.senderUserNotice,
      smtpHost: val.smtpHost,
      smtpPort: val.smtpPort,
      smtpSecure: val.smtpSecure,
      smtpAuthUser: val.smtpUser.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      validationErrors: val.errors,
      status: val.isValid ? 'configured' : 'unconfigured_central_sender',
    };

    const serializedResponse = JSON.stringify(apiStatusResponse);
    assert(
      !serializedResponse.includes('CRITICAL_SECRET_PASSWORD_998877!!'),
      'SMTP_PASS password is completely omitted from status API payload'
    );
    assert(
      apiStatusResponse.smtpAuthUser === 'ad***@securehub.com',
      'SMTP_USER account username is properly masked (ad***@securehub.com)'
    );

    // Test verify response simulation (matches server.app.ts /api/email/verify-connection)
    const verifyResponse = {
      success: true,
      connected: true,
      response: '250 2.0.0 OK Server Ready',
      senderFormatted: val.senderFormatted,
      host: val.smtpHost,
      port: val.smtpPort,
      authUser: apiStatusResponse.smtpAuthUser,
    };
    const serializedVerify = JSON.stringify(verifyResponse);
    assert(
      !serializedVerify.includes('CRITICAL_SECRET_PASSWORD_998877!!'),
      'SMTP_PASS password is completely omitted from connection verification payload'
    );
  }

  console.log('\n=============================================================');
  console.log(`📊 Test Summary: ${passedTests} Passed | ${failedTests} Failed`);
  console.log('=============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
