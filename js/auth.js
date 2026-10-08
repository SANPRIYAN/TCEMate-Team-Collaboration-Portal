(function () {
  'use strict';

  AuthService.$inject = ['$http', '$window', 'API_BASE_URL'];
  function AuthService($http, $window, API_BASE_URL) {
    var tokenKey = 'tcemateToken';
    var userKey = 'tcemateUser';

    function setToken(token) {
      if (token) {
        sessionStorage.setItem(tokenKey, token);
      } else {
        sessionStorage.removeItem(tokenKey);
      }
    }

    function setUser(user) {
      if (user) {
        sessionStorage.setItem(userKey, JSON.stringify(user));
      } else {
        sessionStorage.removeItem(userKey);
      }
    }

    function callApi(endpoint, payload, method) {
      var config = {
        method: method || 'GET',
        url: API_BASE_URL + endpoint
      };

      if (payload !== undefined) {
        config.data = payload;
        config.headers = config.headers || {};
        config.headers['Content-Type'] = 'application/json';
      }

      var token = sessionStorage.getItem(tokenKey);
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = 'Bearer ' + token;
      }

      return $http(config).then(function (response) {
        return response.data || {};
      }).catch(function (error) {
        return {
          success: false,
          message: error && error.data && error.data.message ? error.data.message : 'Request failed.',
          code: error && error.data && error.data.code
        };
      });
    }

    return {
      getToken: function () {
        return sessionStorage.getItem(tokenKey);
      },
      getUser: function () {
        try {
          return JSON.parse(sessionStorage.getItem(userKey));
        } catch (e) {
          return null;
        }
      },
      isLoggedIn: function () {
        return !!sessionStorage.getItem(tokenKey);
      },
      login: function (email, password, role) {
        var endpoint = role === 'admin' ? '/auth/admin/login' : '/auth/login';
        return callApi(endpoint, { email: email, password: password }, 'POST').then(function (result) {
          if (result && result.success && result.token) {
            setToken(result.token);
            setUser(result.user || null);
            return { ok: true, success: true, message: 'Login successful! Redirecting...', user: result.user };
          }
          return result && result.success === false
            ? { ok: false, success: false, message: result.message || 'Login failed.', code: result.code }
            : { ok: false, success: false, message: 'Login failed.' };
        });
      },
      register: function (data) {
        return callApi('/auth/register', {
          fullName: data.fullName,
          email: data.email,
          regNo: data.regNo,
          phone: data.phone,
          password: data.password
        }, 'POST').then(function (result) {
          if (result && result.success) {
            return {
              ok: true,
              success: true,
              email: result.user && result.user.email ? result.user.email : data.email,
              message: result.message || 'Registration successful. You can now log in.'
            };
          }

          return {
            ok: false,
            success: false,
            message: result && result.message ? result.message : 'Registration failed.',
            code: result && result.code
          };
        });
      },
      requestPasswordReset: function (email) {
        return callApi('/auth/forgot-password', { email: email }, 'POST');
      },
      verifyEmail: function (token) {
        return callApi('/auth/verify-email', { token: token }, 'POST');
      },
      getAdminSetupStatus: function () {
        return callApi('/auth/admin/setup/status');
      },
      startAdminSetup: function (data) {
        return callApi('/auth/admin/setup', data, 'POST');
      },
      resetPassword: function (token, password) {
        return callApi('/auth/reset-password', { token: token, password: password }, 'POST');
      },
      logout: function () {
        setToken(null);
        setUser(null);
        if ($window) {
          $window.sessionStorage.removeItem(tokenKey);
          $window.sessionStorage.removeItem(userKey);
        }
      }
    };
  }

  angular.module('tcemate').factory('AuthService', AuthService);
})();
