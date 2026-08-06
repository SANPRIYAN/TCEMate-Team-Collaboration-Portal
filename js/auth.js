(function () {
  'use strict';

  /* 
   * REFACTOR NOTE (Service -> Factory):
   * Converted AuthService from AngularJS .service() to AngularJS .factory().
   * The factory pattern returns a custom object literal with public functions,
   * avoiding 'this' bindings and encapsulating logic internally.
   */
  angular.module('tcemate').factory('AuthService', function () {
    var emailPattern = /^[^\s@]+@(student\.)?tce\.edu$/;
    var passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    var loginKey = 'loggedIn';

    function setLoggedIn(value) {
      sessionStorage.setItem(loginKey, value ? 'true' : 'false');
    }

    return {
      isLoggedIn: function () {
        return sessionStorage.getItem(loginKey) === 'true';
      },
      login: function (email, password) {
        var errors = {};
        if (!emailPattern.test(email)) {
          errors.email = 'Please enter a valid tce.edu email address.';
        }
        if (!passwordPattern.test(password)) {
          errors.password = 'Password must be 8+ chars with uppercase, lowercase, number, and special character.';
        }
        if (Object.keys(errors).length) {
          return { ok: false, errors: errors };
        }
        setLoggedIn(true);
        return { ok: true, message: 'Login successful! Redirecting...' };
      },
      register: function (data) {
        var errors = {};
        if (!/^[a-zA-Z\s]{2,}$/.test(data.fullName || '')) {
          errors.fullName = 'Only letters and spaces are allowed.';
        }
        if (!emailPattern.test(data.email || '')) {
          errors.email = 'Please enter a valid tce.edu email address.';
        }
        if (!/^[a-zA-Z0-9]{5,}$/.test(data.regNo || '')) {
          errors.regNo = 'Register number must be letters/digits only.';
        }
        if (!/^[0-9]{10}$/.test(data.phone || '')) {
          errors.phone = 'Phone number must be exactly 10 digits.';
        }
        if (!passwordPattern.test(data.password || '')) {
          errors.password = 'Password must be 8+ chars with uppercase, lowercase, number, and special character.';
        }
        if (Object.keys(errors).length) {
          return { ok: false, errors: errors };
        }
        setLoggedIn(true);
        return { ok: true, message: 'Account created! Redirecting...' };
      },
      logout: function () {
        setLoggedIn(false);
      }
    };
  });
})();
