import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

/**
 * 🔐 RZUNA SIWS (Sign-In-With-Solana) Protocol V22.3
 * Validates wallet signatures to establish secure, stateless sessions.
 */
export class AuthProtocol {
  /**
   * Validates a SIWS signature against a public key and expected message.
   * Standard: Phantom / Solflare SIWS specification.
   */
  static async validateSignature(
    publicKey: string,
    signature: string,
    message: string
  ): Promise<boolean> {
    try {
      const pubKeyObj = new PublicKey(publicKey);
      const signatureUint8 = bs58.decode(signature);
      const messageUint8 = new TextEncoder().encode(message);

      return nacl.sign.detached.verify(
        messageUint8,
        signatureUint8,
        pubKeyObj.toBytes()
      );
    } catch (error) {
      console.error('🛡️ [Auth] Signature validation failed:', error);
      return false;
    }
  }

  /**
   * 🏗️ TODO: Implement JWT issuance here.
   * For the Clean Sweep baseline, we focus on the validation gateway.
   */
}
