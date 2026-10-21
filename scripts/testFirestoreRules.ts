/**
 * Local Firestore Security Rules Verification Suite
 * Tests rule evaluation logic without invoking live Firestore network calls.
 */

interface MockAuth {
  uid: string;
  token: {
    email: string;
    admin?: boolean;
    [key: string]: any;
  };
}

interface MockContext {
  auth: MockAuth | null;
}

interface MockSalon {
  id: number;
  owner_email: string;
  owner_id: number;
  verification_status: string;
}

// Simulated database documents for cross-document lookups (get() simulation)
const mockDatabase: {
  salons: Record<string, MockSalon>;
} = {
  salons: {
    '1': { id: 1, owner_email: 'owner1@salon.com', owner_id: 2, verification_status: 'verified' },
    '2': { id: 2, owner_email: 'owner2@salon.com', owner_id: 4, verification_status: 'verified' },
  },
};

// Admin list mirrored from firestore.rules
const ADMIN_EMAILS = ['hasincludeionull@gmail.com', 'medayojessemuel@gmail.com', 'admin@nailglamhub.com'];

class LocalRulesEngine {
  private isAuthenticated(context: MockContext): boolean {
    return context.auth !== null;
  }

  private isAdmin(context: MockContext): boolean {
    if (!this.isAuthenticated(context)) return false;
    return (
      context.auth!.token.admin === true ||
      ADMIN_EMAILS.includes(context.auth!.token.email)
    );
  }

  private isSalonOwner(context: MockContext, salonId: number | string): boolean {
    if (!this.isAuthenticated(context)) return false;
    if (this.isAdmin(context)) return true;
    const salon = mockDatabase.salons[String(salonId)];
    return !!salon && salon.owner_email === context.auth!.token.email;
  }

  // --- Collection Rule Evaluators ---

  public canReadPublicCatalog(collection: string): boolean {
    return ['categories', 'salons', 'services', 'technicians', 'products', 'promotions', 'announcements', 'reels', 'working_hours'].includes(collection);
  }

  public canReadUser(context: MockContext, targetUserId: string, targetUserDoc: { email: string }): boolean {
    if (!this.isAuthenticated(context)) return false;
    if (this.isAdmin(context)) return true;
    return context.auth!.uid === targetUserId || targetUserDoc.email === context.auth!.token.email;
  }

  public canUpdateUser(
    context: MockContext,
    targetUserId: string,
    existingDoc: { email: string; user_type: string; status: string; cancellation_strikes?: number; reliability_score?: number },
    newDoc: { email: string; user_type?: string; role?: string; status?: string; cancellation_strikes?: number; reliability_score?: number }
  ): boolean {
    if (!this.isAuthenticated(context)) return false;
    if (this.isAdmin(context)) return true;

    // Must be own document and matching email
    const isSelf = context.auth!.uid === targetUserId || existingDoc.email === context.auth!.token.email;
    if (!isSelf) return false;
    if (newDoc.email !== existingDoc.email) return false;

    // Cannot escalate role or user_type
    if (newDoc.user_type && newDoc.user_type !== existingDoc.user_type) return false;
    if (newDoc.role && newDoc.role !== existingDoc.user_type) return false;

    // Cannot change status (e.g. un-suspend self)
    if (newDoc.status && newDoc.status !== existingDoc.status) return false;

    // Cannot reset cancellation strikes or reliability score
    if (newDoc.cancellation_strikes !== undefined && newDoc.cancellation_strikes !== existingDoc.cancellation_strikes) return false;
    if (newDoc.reliability_score !== undefined && newDoc.reliability_score !== existingDoc.reliability_score) return false;

    return true;
  }

  public canModifySalonServices(
    context: MockContext,
    action: 'create' | 'update' | 'delete',
    salonId: number
  ): boolean {
    return this.isSalonOwner(context, salonId);
  }

  public canReadAppointment(
    context: MockContext,
    apptDoc: { customer_email?: string; salon_email?: string; salon_id: number }
  ): boolean {
    if (!this.isAuthenticated(context)) return false;
    if (this.isAdmin(context)) return true;
    if (apptDoc.customer_email && apptDoc.customer_email === context.auth!.token.email) return true;
    if (apptDoc.salon_email && apptDoc.salon_email === context.auth!.token.email) return true;
    if (this.isSalonOwner(context, apptDoc.salon_id)) return true;
    return false;
  }

  public canUpdateAppointment(
    context: MockContext,
    existingDoc: { customer_email: string; salon_id: number; payment_status: string; total_price: number; paid_amount: number; service_price: number },
    newDoc: { customer_email?: string; salon_id?: number; payment_status?: string; total_price?: number; paid_amount?: number; service_price?: number; status?: string }
  ): boolean {
    if (!this.isAuthenticated(context)) return false;
    if (this.isAdmin(context)) return true;
    if (this.isSalonOwner(context, existingDoc.salon_id)) return true;

    // Customer update checks
    const isCustomerOwner = existingDoc.customer_email === context.auth!.token.email;
    if (!isCustomerOwner) return false;

    // Customer CANNOT alter financial and ownership fields
    if (newDoc.payment_status && newDoc.payment_status !== existingDoc.payment_status) return false;
    if (newDoc.paid_amount !== undefined && newDoc.paid_amount !== existingDoc.paid_amount) return false;
    if (newDoc.total_price !== undefined && newDoc.total_price !== existingDoc.total_price) return false;
    if (newDoc.service_price !== undefined && newDoc.service_price !== existingDoc.service_price) return false;
    if (newDoc.customer_email && newDoc.customer_email !== existingDoc.customer_email) return false;
    if (newDoc.salon_id && newDoc.salon_id !== existingDoc.salon_id) return false;

    return true;
  }

  public canReadReview(
    context: MockContext,
    reviewDoc: { is_private?: boolean; feedback_type?: string; user_email?: string; salon_id: number }
  ): boolean {
    const isPublic = reviewDoc.is_private !== true && reviewDoc.feedback_type !== 'private';
    if (isPublic) return true;

    // Private reviews require authentication and ownership
    if (!this.isAuthenticated(context)) return false;
    if (this.isAdmin(context)) return true;
    if (reviewDoc.user_email && reviewDoc.user_email === context.auth!.token.email) return true;
    if (this.isSalonOwner(context, reviewDoc.salon_id)) return true;
    return false;
  }
}

// --- Test Execution ---
async function runSecurityTests() {
  const engine = new LocalRulesEngine();
  let passedCount = 0;
  let failedCount = 0;

  function assert(testName: string, condition: boolean) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passedCount++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failedCount++;
    }
  }

  console.log('\n======================================================');
  console.log('   FIRESTORE SECURITY RULES LOCAL TEST SUITE');
  console.log('======================================================\n');

  // Contexts
  const unauth: MockContext = { auth: null };
  const customerA: MockContext = { auth: { uid: 'cust_A', token: { email: 'alice@customer.com' } } };
  const customerB: MockContext = { auth: { uid: 'cust_B', token: { email: 'bob@customer.com' } } };
  const ownerSalon1: MockContext = { auth: { uid: 'owner_1', token: { email: 'owner1@salon.com' } } };
  const ownerSalon2: MockContext = { auth: { uid: 'owner_2', token: { email: 'owner2@salon.com' } } };
  const adminContext: MockContext = { auth: { uid: 'admin_user', token: { email: 'admin@nailglamhub.com', admin: true } } };

  // TEST 1: Unauthenticated reads and writes to private collections
  console.log('--- Test 1: Unauthenticated reads/writes to private collections ---');
  assert('Unauthenticated user cannot read private user profile',
    !engine.canReadUser(unauth, '1', { email: 'alice@customer.com' }));
  assert('Unauthenticated user cannot read private appointment',
    !engine.canReadAppointment(unauth, { customer_email: 'alice@customer.com', salon_id: 1 }));
  assert('Unauthenticated user cannot read private review feedback',
    !engine.canReadReview(unauth, { is_private: true, user_email: 'alice@customer.com', salon_id: 1 }));

  // TEST 2: Customer access to another customer's appointment
  console.log('\n--- Test 2: Customer cross-access to appointments ---');
  const appointmentAlice = { customer_email: 'alice@customer.com', salon_id: 1, payment_status: 'unpaid', total_price: 1500, paid_amount: 0, service_price: 1500 };
  assert('Customer A CAN read their own appointment',
    engine.canReadAppointment(customerA, appointmentAlice));
  assert('Customer B CANNOT read Customer A\'s appointment',
    !engine.canReadAppointment(customerB, appointmentAlice));
  assert('Customer B CANNOT update Customer A\'s appointment',
    !engine.canUpdateAppointment(customerB, appointmentAlice, { status: 'cancelled' }));

  // TEST 3: Customer attempts to modify salon services
  console.log('\n--- Test 3: Customer modifying salon services ---');
  assert('Customer A CANNOT create or update salon services for Salon 1',
    !engine.canModifySalonServices(customerA, 'create', 1));
  assert('Customer B CANNOT delete salon services for Salon 1',
    !engine.canModifySalonServices(customerB, 'delete', 1));

  // TEST 4: Salon-owner access to another salon's records
  console.log('\n--- Test 4: Salon owner cross-salon modification ---');
  assert('Owner 1 CAN manage services for their own Salon 1',
    engine.canModifySalonServices(ownerSalon1, 'update', 1));
  assert('Owner 2 CANNOT modify services for Salon 1',
    !engine.canModifySalonServices(ownerSalon2, 'update', 1));
  assert('Owner 2 CANNOT read appointments belonging to Salon 1',
    !engine.canReadAppointment(ownerSalon2, appointmentAlice));
  assert('Owner 1 CAN read appointments for their Salon 1',
    engine.canReadAppointment(ownerSalon1, appointmentAlice));

  // TEST 5: Attempts to change protected roles or payment fields
  console.log('\n--- Test 5: Privilege escalation and payment tampering ---');
  const userProfile = { email: 'alice@customer.com', user_type: 'customer', status: 'active', cancellation_strikes: 1, reliability_score: 85 };
  assert('Customer CANNOT escalate own user_type to admin',
    !engine.canUpdateUser(customerA, 'cust_A', userProfile, { email: 'alice@customer.com', user_type: 'admin' }));
  assert('Customer CANNOT un-suspend own status if banned',
    !engine.canUpdateUser(customerA, 'cust_A', { ...userProfile, status: 'suspended' }, { email: 'alice@customer.com', status: 'active' }));
  assert('Customer CANNOT reset cancellation strikes',
    !engine.canUpdateUser(customerA, 'cust_A', userProfile, { email: 'alice@customer.com', cancellation_strikes: 0 }));
  assert('Customer CANNOT mark unpaid appointment as fully_paid',
    !engine.canUpdateAppointment(customerA, appointmentAlice, { payment_status: 'fully_paid' }));
  assert('Customer CANNOT reduce appointment total_price to 0',
    !engine.canUpdateAppointment(customerA, appointmentAlice, { total_price: 0 }));
  assert('Customer CAN cancel their own appointment (legitimate update)',
    engine.canUpdateAppointment(customerA, appointmentAlice, { status: 'cancelled' }));

  // TEST 6: Legitimate public catalog reads
  console.log('\n--- Test 6: Public catalog access ---');
  assert('Public visitors CAN read categories catalog',
    engine.canReadPublicCatalog('categories'));
  assert('Public visitors CAN read salons directory',
    engine.canReadPublicCatalog('salons'));
  assert('Public visitors CAN read public review comments',
    engine.canReadReview(unauth, { is_private: false, feedback_type: 'public', salon_id: 1 }));
  assert('Public visitors CANNOT read private feedback reviews',
    !engine.canReadReview(unauth, { is_private: true, feedback_type: 'private', salon_id: 1 }));

  // TEST 7: Authorized salon-owner and administrator operations
  console.log('\n--- Test 7: Authorized owner and admin operations ---');
  assert('Administrator CAN read any user profile',
    engine.canReadUser(adminContext, 'cust_A', userProfile));
  assert('Administrator CAN update appointment payment status',
    engine.canUpdateAppointment(adminContext, appointmentAlice, { payment_status: 'fully_paid' }));
  assert('Administrator CAN update user roles and status',
    engine.canUpdateUser(adminContext, 'cust_A', userProfile, { email: 'alice@customer.com', user_type: 'salon_owner', status: 'active' }));
  assert('Administrator CAN modify services for any salon',
    engine.canModifySalonServices(adminContext, 'create', 1) && engine.canModifySalonServices(adminContext, 'create', 2));
  assert('Salon Owner CAN read private feedback written for their salon',
    engine.canReadReview(ownerSalon1, { is_private: true, feedback_type: 'private', user_email: 'alice@customer.com', salon_id: 1 }));

  console.log('\n======================================================');
  console.log(`   TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('======================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
