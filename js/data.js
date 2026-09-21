(function () {
  'use strict';

  DataService.$inject = ['$http', '$q', 'API_BASE_URL', 'AuthService'];
  function DataService($http, $q, API_BASE_URL, AuthService) {
    function request(method, endpoint, payload) {
      var config = {
        method: method,
        url: API_BASE_URL + endpoint
      };

      if (payload !== undefined) {
        config.data = payload;
      }

      var token = AuthService.getToken();
      if (token) {
        config.headers = {
          Authorization: 'Bearer ' + token
        };
      }

      return $http(config).then(function (response) {
        return response.data || {};
      }).catch(function (error) {
        return {
          success: false,
          message: error && error.data && error.data.message ? error.data.message : 'Request failed.'
        };
      });
    }

    return {
      getProjects: function () {
        return request('GET', '/projects').then(function (response) {
          return response && response.success ? (response.projects || []) : [];
        });
      },
      getApplicants: function () {
        return request('GET', '/applicants').then(function (response) {
          return response && response.success ? (response.applicants || []) : [];
        });
      },
      getMyApplications: function () {
        return request('GET', '/applicants?mine=true').then(function (response) {
          return response && response.success ? (response.applicants || []) : [];
        });
      },
      getTeams: function () {
        return [
          { id: 1, name: 'Current Team', role: 'Lead' },
          { id: 2, name: 'Project Partner', role: 'Member' }
        ];
      },
      getNotifications: function () {
        return request('GET', '/notifications').then(function (response) {
          return response && response.success ? (response.notifications || []) : [];
        });
      },
      getInterests: function () {
        return request('GET', '/interests').then(function (response) {
          return response && response.success ? (response.interests || []) : [];
        });
      },
      applyToProject: function (project, user) {
        return request('POST', '/applicants', {
          project: project.id,
          name: user.name,
          regNo: user.regNo,
          department: user.department,
          year: user.year,
          skills: user.skills || [],
          matchScore: project.matchScore || 0
        }).then(function (response) {
          return response;
        });
      },
      updateApplicantStatus: function (applicantId, status) {
        return request('PUT', '/applicants/' + applicantId, { status: status }).then(function (response) {
          return response;
        });
      },
      getDiscussions: function () {
        return request('GET', '/discussions').then(function (response) {
          return response && response.success ? (response.discussions || []) : [];
        });
      },
      getCurrentUser: function () {
        return request('GET', '/users/me').then(function (response) {
          return response && response.success ? response.user : null;
        });
      },
      getLandingStats: function () {
        return $q.all({
          projects: this.getProjects(),
          applicants: this.getApplicants()
        }).then(function (data) {
          var openProjects = (data.projects || []).filter(function (project) { return project.status === 'open'; }).length;
          return [
            { value: openProjects, label: 'Active Projects' },
            { value: (data.applicants || []).length, label: 'Pending Requests' },
            { value: 12, label: 'Connections' }
          ];
        });
      },
      updateProfile: function (profile) {
        return request('PUT', '/users/me', profile).then(function (response) {
          return response && response.success ? response.user : null;
        });
      },
      createListing: function (listing, teamSize) {
        return request('POST', '/projects', {
          title: listing.title,
          description: listing.description,
          type: listing.type,
          department: listing.department,
          year: listing.year,
          deadline: listing.deadline,
          teamSize: teamSize,
          status: 'open'
        }).then(function (response) {
          return response;
        });
      },
      removeApplicant: function (applicantId) {
        return request('DELETE', '/applicants/' + applicantId).then(function (response) {
          return response;
        });
      },
      addDiscussion: function (post) {
        return request('POST', '/discussions', {
          tag: 'Discussion',
          title: post.title,
          body: post.body
        }).then(function (response) {
          return response;
        });
      },
      markAllNotificationsRead: function () {
        return request('PUT', '/notifications/read-all').then(function (response) {
          return response;
        });
      },
      markNotificationRead: function (notificationId) {
        return request('PUT', '/notifications/' + notificationId + '/read').then(function (response) {
          return response;
        });
      },
      getMatchScore: function (requiredSkills, candidateSkills) {
        var required = requiredSkills || [];
        var candidate = candidateSkills || [];
        if (!required.length) {
          return 0;
        }
        var matched = required.filter(function (skill) {
          return candidate.indexOf(skill) !== -1;
        });
        return Math.round((matched.length / required.length) * 100);
      }
    };
  }
  angular.module('tcemate').factory('DataService', DataService);
})();
