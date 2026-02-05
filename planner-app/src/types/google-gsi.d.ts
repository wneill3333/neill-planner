/**
 * TypeScript type declarations for Google Identity Services (GIS)
 * Based on https://developers.google.com/identity/oauth2/web/reference/js-reference
 */

declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenClient {
        /**
         * Callback function to handle the authorization response
         */
        callback: (response: TokenResponse) => void;

        /**
         * Request an access token
         */
        requestAccessToken(options?: { prompt?: 'consent' | 'select_account' | '' }): void;
      }

      interface TokenResponse {
        /**
         * The Access Token returned by the authorization server
         */
        access_token: string;

        /**
         * A list of scopes that are approved by the user
         */
        scope: string;

        /**
         * The lifetime in seconds of the access token
         */
        expires_in: string;

        /**
         * The error code if an error occurred
         */
        error?: string;

        /**
         * The error description if an error occurred
         */
        error_description?: string;

        /**
         * The token type
         */
        token_type?: string;
      }

      interface TokenClientConfig {
        /**
         * The client ID for your application
         */
        client_id: string;

        /**
         * The scopes to request
         */
        scope: string | string[];

        /**
         * Callback to handle the authorization response
         */
        callback?: (response: TokenResponse) => void;

        /**
         * Optional UX mode
         */
        prompt?: '' | 'none' | 'consent' | 'select_account';

        /**
         * Optional hint about the user's login state
         */
        hint?: string;

        /**
         * Optional hosted domain
         */
        hosted_domain?: string;

        /**
         * Optional state parameter
         */
        state?: string;

        /**
         * If true, request access to user data while the user is not present
         */
        enable_serial_consent?: boolean;

        /**
         * Error callback
         */
        error_callback?: (error: { type: string; message?: string }) => void;
      }

      /**
       * Initialize a token client to request access tokens
       */
      function initTokenClient(config: TokenClientConfig): TokenClient;

      /**
       * Revoke an access token or refresh token
       */
      function revoke(token: string, callback?: () => void): void;

      /**
       * Check if a user has granted specific scopes
       */
      function hasGrantedAllScopes(
        tokenResponse: TokenResponse,
        ...scopes: string[]
      ): boolean;

      /**
       * Check if a user has granted any of the specified scopes
       */
      function hasGrantedAnyScope(
        tokenResponse: TokenResponse,
        ...scopes: string[]
      ): boolean;
    }
  }
}
