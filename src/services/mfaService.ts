import {
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  multiFactor,
  MultiFactorResolver,
  User,
  MultiFactorInfo
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * 1. Send SMS Code for Phone Enrollment (In Settings)
 */
export const startMfaEnrollment = async (user: User, phoneNumber: string) => {
  if (!auth) throw new Error('Firebase Authentication is not initialized.');
  const session = await multiFactor(user).getSession();
  const phoneAuthProvider = new PhoneAuthProvider(auth);

  // Send verification code directly
  const verificationId = await phoneAuthProvider.verifyPhoneNumber(
    { phoneNumber, session },
    undefined as any
  );

  return verificationId;
};

/**
 * 2. Finalize Phone Enrollment with 6-digit OTP
 */
export const finalizeMfaEnrollment = async (
  user: User,
  verificationId: string,
  smsCode: string,
  mfaName: string = 'Personal Mobile Phone'
) => {
  const cred = PhoneAuthProvider.credential(verificationId, smsCode);
  const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

  await multiFactor(user).enroll(multiFactorAssertion, mfaName);
  return true;
};

/**
 * 3. Send SMS Code during Sign-In Challenge
 */
export const sendMfaSignInCode = async (
  resolver: MultiFactorResolver,
  selectedHintIndex: number = 0
) => {
  if (!auth) throw new Error('Firebase Authentication is not initialized.');
  const phoneAuthProvider = new PhoneAuthProvider(auth);

  const verificationId = await phoneAuthProvider.verifyPhoneNumber(
    {
      multiFactorHint: resolver.hints[selectedHintIndex],
      session: resolver.session
    },
    undefined as any
  );

  return verificationId;
};

/**
 * 4. Verify Sign-In SMS OTP and Resolve Session
 */
export const resolveMfaChallenge = async (
  resolver: MultiFactorResolver,
  verificationId: string,
  smsCode: string
) => {
  const cred = PhoneAuthProvider.credential(verificationId, smsCode);
  const assertion = PhoneMultiFactorGenerator.assertion(cred);
  const userCredential = await resolver.resolveSignIn(assertion);
  return userCredential.user;
};

/**
 * 5. Get list of enrolled MFA factors for user
 */
export const getEnrolledMfaFactors = (user: User | null): MultiFactorInfo[] => {
  if (!user) return [];
  return multiFactor(user).enrolledFactors || [];
};

/**
 * 6. Unenroll an MFA factor
 */
export const unenrollMfaFactor = async (user: User, factorOrUid: MultiFactorInfo | string) => {
  if (!user) throw new Error('No active user session');
  if (typeof factorOrUid === 'string') {
    const factors = multiFactor(user).enrolledFactors;
    const target = factors.find(f => f.uid === factorOrUid);
    if (target) {
      await multiFactor(user).unenroll(target);
    } else {
      throw new Error('MFA Factor not found');
    }
  } else {
    await multiFactor(user).unenroll(factorOrUid);
  }
  return true;
};

