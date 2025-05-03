/*
MIT License

Copyright (c) 2019 @crouchcd
Copyright (c) 2024 M31Lab/m31-mini

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

Adapted from: https://github.com/crouchcd/pkce-challenge
Modified to support different code challenge methods and improve type safety.
*/

/**
 * Supported PKCE challenge methods
 */
export type ChallengeMethod = "plain" | "S256";

/**
 * PKCE challenge pair containing verifier and challenge
 */
export interface PkceChallengePair {
  code_verifier: string;
  code_challenge: string;
}

/**
 * Creates a cryptographically secure array of random bytes
 * 
 * @param size - Number of random bytes to generate
 * @returns Uint8Array of random values
 */
function getRandomValues(size: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(size));
}

/**
 * Generates a cryptographically strong random string using URL-safe characters
 * 
 * @param size - The desired length of the string
 * @returns Random string of specified length
 */
function generateRandomString(size: number): string {
  // Characters allowed in the URL-safe base64 encoding
  const allowedChars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~";

  let result = "";
  const randomValues = getRandomValues(size);

  for (let i = 0; i < size; i++) {
    // Ensure the index is within bounds of the allowed characters
    const randomIndex = randomValues[i] % allowedChars.length;
    result += allowedChars[randomIndex];
  }

  return result;
}

/**
 * Generates a PKCE challenge verifier of specified length
 * 
 * @param length - Length of the verifier
 * @returns Random verifier string
 */
function generateVerifier(length: number): string {
  return generateRandomString(length);
}

/**
 * Generates a PKCE code challenge from a code verifier using the specified method
 * 
 * @param codeVerifier - The code verifier to generate a challenge from
 * @param method - Challenge method ("plain" or "S256")
 * @returns The code challenge (base64url encoded if using S256)
 * @throws Error if an unsupported challenge method is provided
 */
export async function generateChallenge(
  codeVerifier: string,
  method: ChallengeMethod = "S256"
): Promise<string> {
  if (method === "plain") {
    return codeVerifier;
  }

  if (method === "S256") {
    try {
      // Create SHA-256 hash of the verifier
      const buffer = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(codeVerifier)
      );

      // Convert to base64url format (base64 with URL-safe characters)
      return btoa(String.fromCharCode(...new Uint8Array(buffer)))
        .replace(/\//g, '_')  // Replace '/' with '_'
        .replace(/\+/g, '-')  // Replace '+' with '-'
        .replace(/=/g, '');   // Remove padding '='
    } catch (error) {
      throw new Error(`Failed to generate S256 challenge: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`Unsupported challenge method: ${method}`);
}

/**
 * Generates a complete PKCE challenge pair (verifier and challenge)
 * 
 * @param length - Length of the verifier (between 43-128 characters)
 * @param method - Challenge method ("plain" or "S256")
 * @returns Object containing code_verifier and code_challenge
 * @throws Error if length is outside the allowed range
 */
export default async function pkceChallenge(
  length: number = 43,
  method: ChallengeMethod = "S256"
): Promise<PkceChallengePair> {
  // PKCE spec requires verifier length between 43-128 characters
  if (length < 43 || length > 128) {
    throw new Error(`Expected a length between 43 and 128. Received ${length}.`);
  }

  const verifier = generateVerifier(length);
  const challenge = await generateChallenge(verifier, method);

  return {
    code_verifier: verifier,
    code_challenge: challenge,
  };
}

/**
 * Verifies that a code verifier produces the expected code challenge
 * 
 * @param codeVerifier - The code verifier to verify
 * @param expectedChallenge - The expected code challenge
 * @param method - Challenge method used ("plain" or "S256")
 * @returns True if the generated challenge matches the expected challenge
 */
export async function verifyChallenge(
  codeVerifier: string,
  expectedChallenge: string,
  method: ChallengeMethod = "S256"
): Promise<boolean> {
  try {
    const actualChallenge = await generateChallenge(codeVerifier, method);
    return actualChallenge === expectedChallenge;
  } catch (error) {
    console.error(`[M31 Mini] Challenge verification failed:`, error);
    return false;
  }
}
