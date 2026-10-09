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
          message: error && error.data && error.data.message ? error.data.message : 'Request failed.',
          status: error && error.status,
          missingSkills: error && error.data && error.data.missingSkills || []
        };
      });
    }

    function formatDateInput(value) {
      if (!(value instanceof Date)) return value;
      var year = value.getFullYear();
      var month = String(value.getMonth() + 1).padStart(2, '0');
      var day = String(value.getDate()).padStart(2, '0');
      return year + '-' + month + '-' + day;
    }

    function getProjects() {
      return request('GET', '/projects').then(function (response) {
        return response && response.success ? (response.projects || []) : [];
      });
    }

    function getMyProjects(user) {
      var userId = user && (user.id || user._id);
      if (!userId) {
        return $q.when([]);
      }

      return getProjects().then(function (projects) {
        return projects.filter(function (project) {
          var owner = project.createdBy || project.owner;
          var ownerId = owner && typeof owner === 'object' ? (owner.id || owner._id) : owner;
          return String(ownerId || '') === String(userId);
        });
      });
    }

    return {
      getProjects: getProjects,
      getMyProjects: getMyProjects,
      getProject: function (projectId) {
        return request('GET', '/projects/' + encodeURIComponent(projectId)).then(function (response) {
          return response && response.success ? response.project : null;
        });
      },
      getApplicants: function () {
        return request('GET', '/applicants').then(function (response) {
          return response && response.success ? (response.applicants || []) : [];
        });
      },
      getApplicantsForProject: function (projectId) {
        return request('GET', '/applicants?project=' + encodeURIComponent(projectId)).then(function (response) {
          return response && response.success ? (response.applicants || []) : [];
        });
      },
      getMyApplications: function () {
        return request('GET', '/applicants?mine=true').then(function (response) {
          return response && response.success ? (response.applicants || []) : [];
        });
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
      applyToProject: function (project) {
        return request('POST', '/applicants', {
          project: project.id
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
      getDiscussionById: function (discussionId) {
        return request('GET', '/discussions/' + encodeURIComponent(discussionId)).then(function (response) {
          return response && response.success ? response.discussion : null;
        });
      },
      voteDiscussion: function (discussionId, dir) {
        return request('POST', '/discussions/' + encodeURIComponent(discussionId) + '/vote', { dir: dir }).then(function (response) {
          return response && response.success ? response.discussion : null;
        });
      },
      addComment: function (discussionId, text, parentId) {
        return request('POST', '/discussions/' + encodeURIComponent(discussionId) + '/comments', { text: text, parentId: parentId }).then(function (response) {
          return response;
        });
      },
      voteComment: function (discussionId, commentId, dir) {
        return request('POST', '/discussions/' + encodeURIComponent(discussionId) + '/comments/' + encodeURIComponent(commentId) + '/vote', { dir: dir }).then(function (response) {
          return response && response.success ? response.discussion : null;
        });
      },
      getCurrentUser: function () {
        return request('GET', '/users/me').then(function (response) {
          return response && response.success ? response.user : null;
        });
      },
      getUserById: function (userId) {
        return request('GET', '/users/' + encodeURIComponent(userId)).then(function (response) {
          return response && response.success ? response.user : null;
        });
      },
      getAdminOverview: function () {
        return request('GET', '/admin/overview');
      },
      getAdminStudents: function () {
        return request('GET', '/admin/students');
      },
      getAdminStudent: function (studentId) {
        return request('GET', '/admin/students/' + encodeURIComponent(studentId));
      },
      getAdminProjects: function () {
        return request('GET', '/admin/projects');
      },
      getAdminInterests: function () {
        return request('GET', '/admin/interests');
      },
      getLandingStats: function () {
        return $q.all({
          projects: this.getProjects(),
          applicants: this.getApplicants()
        }).then(function (data) {
          var openProjects = (data.projects || []).filter(function (project) { return project.status === 'open'; }).length;
          var pendingApplicants = (data.applicants || []).filter(function (applicant) { return applicant.status === 'pending'; }).length;
          return [
            { value: openProjects, label: 'Active Projects' },
            { value: pendingApplicants, label: 'Pending Requests' }
          ];
        });
      },
      getDashboardData: function () {
        return $q.all({
          projects: this.getProjects(),
          applications: this.getMyApplications(),
          interests: this.getInterests(),
          notifications: this.getNotifications()
        }).then(function (data) {
          var projects = data.projects || [];
          var notifications = data.notifications || [];
          return {
            stats: [
              { value: projects.filter(function (project) { return project.status === 'open'; }).length, label: 'Projects Available', icon: '⌂' },
              { value: (data.applications || []).length, label: 'My Applications', icon: '↗' },
              { value: (data.interests || []).length, label: 'My Interests', icon: '☆' },
              { value: notifications.filter(function (notification) { return notification.unread; }).length, label: 'Unread Notifications', icon: '!' }
            ],
            projects: projects.slice(0, 4),
            notifications: notifications.slice(0, 4)
          };
        });
      },
      updateProfile: function (profile) {
        return request('PUT', '/users/me', {
          name: profile.name,
          phone: profile.phone,
          department: profile.department,
          year: profile.year,
          section: profile.section,
          bio: profile.bio,
          preferences: profile.preferences
        }).then(function (response) {
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
          deadline: formatDateInput(listing.deadline),
          requiredSkills: listing.requiredSkills,
          teamSize: teamSize,
          status: 'open'
        }).then(function (response) {
          return response;
        });
      },
      addSkill: function (name) {
        return request('POST', '/users/me/skills', { name: name });
      },
      updateSkill: function (skillId, name) {
        return request('PUT', '/users/me/skills/' + encodeURIComponent(skillId), { name: name });
      },
      deleteSkill: function (skillId) {
        return request('DELETE', '/users/me/skills/' + encodeURIComponent(skillId));
      },
      deleteProject: function (projectId) {
        return request('DELETE', '/projects/' + encodeURIComponent(projectId));
      },
      setStudentActive: function (studentId, isActive) {
        return request('PATCH', '/admin/students/' + encodeURIComponent(studentId) + '/status', { isActive: isActive });
      },
      deleteStudent: function (studentId) {
        return request('DELETE', '/admin/students/' + encodeURIComponent(studentId));
      },
      getAdminDiscussions: function () {
        return request('GET', '/admin/discussions');
      },
      deleteDiscussion: function (discussionId) {
        return request('DELETE', '/discussions/' + encodeURIComponent(discussionId));
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
          return candidate.some(function (candidateSkill) {
            var candidateName = candidateSkill && candidateSkill.name || candidateSkill;
            return String(candidateName || '').trim().toLowerCase() === String(skill || '').trim().toLowerCase();
          });
        });
        return Math.round((matched.length / required.length) * 100);
      }
    };
  }
  angular.module('tcemate').factory('DataService', DataService);
})();
