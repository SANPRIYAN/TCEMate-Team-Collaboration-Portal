(function () {
  'use strict';

  /* 
   * REFACTOR NOTE (Service -> Factory):
   * Converted DataService from AngularJS .service() to AngularJS .factory().
   * In AngularJS Factory, we create internal data structures and return an object exposing 
   * core data manipulation functions (getItems, addItem, deleteItem, updateItem) rather than 
   * binding methods to 'this' (as done in services).
   */
  angular.module('tcemate').factory('DataService', function () {
    var storageKey = 'tcemateData';
    var defaults = {
      students: [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@student.tce.edu',
          department: 'Information Technology',
          year: '3rd Year',
          section: 'Section A',
          bio: 'Passionate about semantic search and applied ML.',
          skills: ['Python', 'Machine Learning', 'Web Development', 'SQL'],
          projects: ['AI Career Intelligence Platform', 'TCE Parking Portal'],
          preferences: { hackathon: true, internship: true }
        }
      ],
      projects: [
        {
          id: 1,
          title: 'AI Career Intelligence Platform',
          description: 'Semantic job-matching engine built during the AI Consortium Internship. Looking for a teammate skilled in NLP preprocessing.',
          type: 'Internship Project',
          department: 'Information Technology',
          year: '3rd Year',
          status: 'open',
          timeLabel: '2h ago',
          matchScore: 92
        },
        {
          id: 2,
          title: 'TCE Parking Portal',
          description: 'Smart parking slot booking web app for campus — built as a team mini-project for Section A.',
          type: 'Campus Project',
          department: 'Information Technology',
          year: '3rd Year',
          status: 'closed',
          timeLabel: 'Yesterday',
          matchScore: 74
        },
        {
          id: 3,
          title: 'Campus Energy Monitor Dashboard',
          description: 'IoT-based dashboard tracking energy usage across the library block. Looking for a frontend teammate.',
          type: 'Hackathon',
          department: 'Information Technology',
          year: '3rd Year',
          status: 'open',
          timeLabel: '1d ago',
          matchScore: 67
        },
        {
          id: 4,
          title: 'Automated Gear Assembly Design',
          description: 'Looking for a solidworks designer to collaborate on a gear assembly simulation project.',
          type: 'Academic Mini-Project',
          department: 'Mechanical',
          year: '3rd Year',
          status: 'open',
          timeLabel: '3h ago',
          matchScore: 58
        },
        {
          id: 5,
          title: '5G Antenna Design Optimization',
          description: 'Research project under Prof. Kumar. Needed someone with HFSS software experience.',
          type: 'Research',
          department: 'ECE',
          year: '3rd Year',
          status: 'closed',
          timeLabel: '1w ago',
          matchScore: 45
        }
      ],
      applicants: [
        { id: 1, name: 'Divya Shree', regNo: '2023IT041', department: 'IT Dept', year: 'Year 3', skills: ['Python', 'NLP'], matchScore: 92 },
        { id: 2, name: 'Keerthana R', regNo: '2023IT018', department: 'IT Dept', year: 'Year 3', skills: ['React', 'UI Design'], matchScore: 71 },
        { id: 3, name: 'Ram Mohan', regNo: '2023IT027', department: 'IT Dept', year: 'Year 3', skills: ['SQL', 'Data Analysis'], matchScore: 64 }
      ],
      teams: [
        { id: 1, name: 'John Doe', role: 'Lead' },
        { id: 2, name: 'Aravind K', role: 'Member' }
      ],
      notifications: [
        { id: 1, title: 'New application received', message: 'Divya Shree applied to join AI Career Intelligence Platform.', timeLabel: '10 minutes ago', unread: true, icon: '🔔' },
        { id: 2, title: 'New forum reply', message: 'Prof. Meenakshi replied to your thread about the AI Consortium documentation.', timeLabel: '1 hour ago', unread: true, icon: '💬' },
        { id: 3, title: 'Application accepted', message: 'You\'ve been added to the TCE Parking Portal team.', timeLabel: 'Yesterday', unread: false, icon: '✅' }
      ],
      interests: [
        { id: 1, title: 'Neural Network Research Assistant', details: 'Computer Science Dept · Year 4', status: 'pending' },
        { id: 2, title: 'TCE Parking Portal', details: 'IT Dept · Year 3, Sec A', status: 'accepted' },
        { id: 3, title: 'Modernist Poetry Critique Group', details: 'English Dept · Graduate', status: 'rejected' },
        { id: 4, title: 'Open Source Kernel Contribution', details: 'Software Engineering · Year 2', status: 'pending' }
      ],
      discussions: [
        { id: 1, tag: 'Project Advice', author: 'Keerthana R · Year 3', title: 'Best way to structure a Flask backend for a college mini-project?', body: 'Working on our IT department mini-project and want a clean folder structure before we scale it up. Any templates you\'d recommend?', replies: 8, timeLabel: '3h ago' },
        { id: 2, tag: 'Opportunity', author: 'Prof. Meenakshi · Faculty', title: 'Looking for 2 students to help with AI Consortium documentation', body: 'Need help preparing the internal report for the semantic matching platform. Great for anyone who wants writing + technical experience.', replies: 15, timeLabel: '1d ago' }
      ],
      currentUserId: 1
    };

    function loadState() {
      try {
        var saved = JSON.parse(localStorage.getItem(storageKey));
        if (saved) {
          return saved;
        }
      } catch (e) {}
      return defaults;
    }

    function saveState(state) {
      localStorage.setItem(storageKey, JSON.stringify(state));
    }

    var state = loadState();

    function ensureState() {
      state = state || defaults;
      state.students = state.students || defaults.students;
      state.projects = state.projects || defaults.projects;
      state.applicants = state.applicants || defaults.applicants;
      state.teams = state.teams || defaults.teams;
      state.notifications = state.notifications || defaults.notifications;
      state.interests = state.interests || defaults.interests;
      state.discussions = state.discussions || defaults.discussions;
      state.currentUserId = state.currentUserId || defaults.currentUserId;
      saveState(state);
    }

    ensureState();

    function getCurrentUser() {
      return state.students.find(function (student) {
        return student.id === state.currentUserId;
      }) || state.students[0];
    }

    // ----------------------------------------------------
    // Core Logic Functions (Factory Pattern)
    // ----------------------------------------------------
    function getItems(category) {
      ensureState();
      return state[category] || [];
    }

    function addItem(category, item) {
      ensureState();
      var newItem = Object.assign({ id: Date.now() }, item);
      if (!state[category]) {
        state[category] = [];
      }
      state[category].unshift(newItem);
      saveState(state);
      return newItem;
    }

    function deleteItem(category, id) {
      ensureState();
      if (state[category]) {
        state[category] = state[category].filter(function (item) {
          return item.id !== id;
        });
        saveState(state);
      }
      return state[category] || [];
    }

    function updateItem(category, id, data) {
      ensureState();
      if (state[category]) {
        state[category] = state[category].map(function (item) {
          if (item.id === id) {
            return Object.assign({}, item, data);
          }
          return item;
        });
        saveState(state);
      }
      return getItems(category);
    }

    // Return single factory object exposing public methods (No 'this' syntax used)
    return {
      // Standard CRUD Factory Methods
      getItems: getItems,
      addItem: addItem,
      deleteItem: deleteItem,
      updateItem: updateItem,

      // Specific Domain Functions
      getProjects: function () {
        return getItems('projects');
      },
      getApplicants: function () {
        return getItems('applicants');
      },
      getTeams: function () {
        return getItems('teams');
      },
      getNotifications: function () {
        return getItems('notifications');
      },
      getInterests: function () {
        return getItems('interests');
      },
      getDiscussions: function () {
        return getItems('discussions');
      },
      getCurrentUser: function () {
        return getCurrentUser();
      },
      getLandingStats: function () {
        return [
          { value: getItems('projects').filter(function (project) { return project.status === 'open'; }).length, label: 'Active Projects' },
          { value: getItems('applicants').length, label: 'Pending Requests' },
          { value: getItems('teams').length + 11, label: 'Connections' }
        ];
      },
      updateProfile: function (profile) {
        return updateItem('students', state.currentUserId, profile);
      },
      createListing: function (listing, teamSize) {
        return addItem('projects', Object.assign({
          title: listing.title,
          description: listing.description,
          type: listing.type,
          department: listing.department,
          year: listing.year,
          status: 'open',
          timeLabel: 'Just now',
          matchScore: 0
        }, listing));
      },
      removeApplicant: function (applicantId) {
        return deleteItem('applicants', applicantId);
      },
      addDiscussion: function (post) {
        return addItem('discussions', {
          tag: 'Discussion',
          author: 'You',
          title: post.title,
          body: post.body,
          replies: 0,
          timeLabel: 'Just now'
        });
      },
      markAllNotificationsRead: function () {
        state.notifications = state.notifications.map(function (notification) {
          notification.unread = false;
          return notification;
        });
        saveState(state);
        return state.notifications;
      },
      getMatchScore: function (requiredSkills, candidateSkills) {
        var matched = requiredSkills.filter(function (skill) {
          return candidateSkills.indexOf(skill) !== -1;
        });
        return Math.round((matched.length / requiredSkills.length) * 100);
      }
    };
  });
})();
