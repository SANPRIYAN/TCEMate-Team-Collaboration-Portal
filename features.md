24IT069 
EX NO: [Insert Ex. No]   
DATE: [Insert Date]   
 
Aim: 
To develop the web pages of the TCEMate Collaboration Portal using HTML5, CSS3, and JavaScript, heavily utilizing modern web standards and rich semantic tags.

Description: 

1. Login & Signup Page (login.html)
Semantic HTML5 Tags:
`<main>` and `<header>` outline the structural layout.
```html
<main class="auth-wrap">
    <form class="auth-card" id="loginForm" novalidate>
        <!-- Login content -->
    </form>
</main>
```

Input Types and Validation Attributes:
The form utilizes specialized HTML5 inputs for mobile optimization.
```html
type="email":
<input type="email" id="loginEmail" name="loginEmail" placeholder="you@student.tce.edu" required>

type="password" & minlength:
<input type="password" id="loginPassword" name="loginPassword" placeholder="••••••••" minlength="8" required>

type="tel":
<input type="tel" id="phone" name="phone" placeholder="10 digits only" required>
```


2. Dashboard Page (index.html)
Rich HTML5 Media and UI Feedback:
```html
<header> & <nav>: 
<header class="topbar">
    <h1 class="logo">TCEMate</h1>
    <nav class="main-nav">
        <a href="index.html" class="active">Dashboard</a>
    </nav>
</header>

<mark>:
<p class="sub">You're part of the team — your project has <mark>3 new updates</mark>.</p>

<meter>:
<meter value="45" min="0" max="100" low="30" high="80" optimum="10">45%</meter>

<details> & <summary>:
<details style="margin-top: 1rem;">
    <summary style="font-weight: 600; cursor: pointer;">Watch Orientation Video</summary>
    <div style="margin-top: 0.8rem;">
        <video controls width="100%">
            <source src="orientation.mp4" type="video/mp4">
            Your browser does not support the video tag.
        </video>
    </div>
</details>
```


3. Profile View Page (profile-view.html)
Interactive and Multimedia Elements:
```html
<figure> & <figcaption>:
<figure style="margin: 0;">
    <div class="avatar-circle">JD</div>
    <figcaption style="text-align: center;">Profile Photo</figcaption>
</figure>

<audio> & <source>:
<audio controls style="width: 100%;">
    <source src="self-intro.mp3" type="audio/mpeg">
</audio>

<progress>:
<progress value="85" max="100" style="width:100%;"></progress>

<ol> & <li> (Semantic Lists for Timelines):
<ol class="timeline">
    <li>
        <span class="timeline-date">2025 – Present</span>
        <h4>AI Consortium Internship</h4>
    </li>
</ol>
```


4. Create Listing Page (create-listing.html)
Form Organization & Data Grouping:
```html
<fieldset> & <legend>:
<fieldset style="border: none; padding: 0; margin: 0;">
    <legend style="display: none;">Listing Details</legend>
    <label for="listingTitle">Project Title</label>
    <input type="text" id="listingTitle" required>
</fieldset>

<datalist>:
<input list="projectTypes" id="listingType" placeholder="Type to search..." required>
<datalist id="projectTypes">
    <option value="Academic Mini-Project">
    <option value="Internship Project">
    <option value="Hackathon Team">
</datalist>

<optgroup>:
<select id="listingDept">
    <optgroup label="General">
        <option value="">Any Department</option>
    </optgroup>
    <optgroup label="Engineering">
        <option selected>Information Technology</option>
        <option>Computer Science</option>
    </optgroup>
</select>
```


5. Browse & Filtering Page (browse.html)
Interactive Filtering Elements:
```html
<input> and <button>:
<div class="search-box">
    <input type="text" id="searchInput" placeholder="Search by project...">
    <button id="searchBtn" class="btn-primary">Search</button>
</div>
```


6. CSS3 Features (style.css)
Modern CSS techniques utilized for robust styling, layouts, and animations.
```css
CSS Variables (Custom Properties): 
:root {
  --primary: #a63500;
  --bg: #faf9f7;
  --surface: #ffffff;
  --radius: 10px;
}

CSS Grid Layout:
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

Flexbox (Alignments): 
.auth-wrap { 
    display: flex; 
    justify-content: center; 
}

CSS3 Animations (@keyframes):
@keyframes fadeInSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.listing-card {
  animation: fadeInSlideUp 0.5s ease-out forwards;
}

Transitions & Transforms:
.stat-card {
  transition: all 0.3s ease-in-out;
}
.stat-card:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

Validation Pseudo-classes (:valid / :invalid / :focus): 
.auth-card input:focus:invalid { 
  border-color: #ba1a1a; 
  outline: none;
}
.auth-card input:focus:valid { 
  border-color: #22c55e;
  outline: none;
}

Media Queries (Responsiveness):
@media screen and (max-width: 768px) {
  .topbar { flex-direction: column; gap: 1rem; }
  .stats-row { grid-template-columns: 1fr; }
}
```


7. JavaScript Features (script.js)
Dynamic UI updates and client-side form validation mechanisms.
```javascript
DOM Selection & Traversal: 
const loginForm = document.getElementById('loginForm');
const deptLabel = card.querySelector('.dept-label');

Event Listeners (Handling Interactions): 
searchBtn.addEventListener('click', () => {
    const query = searchInput.value.toLowerCase();
    const dept = deptFilter.value;
    // Filtering logic...
});

Form Submission Override: 
loginForm.addEventListener('submit', (e) => {
    e.preventDefault(); 
    // Custom validation logic here
});

Regular Expressions (Regex) Validation:
const pattern = /^[a-zA-Z\s]{2,}$/;
if (pattern && !pattern.test(value)) {
    showError(inputId, errorId, invalidMsg);
}

Client-Side Storage (SessionStorage):
sessionStorage.setItem('loggedIn', 'true');
sessionStorage.removeItem('loggedIn');

Browser Navigation (Redirects):
window.location.href = 'index.html';
```

Result:  
The web pages of the TCEMate Portal were successfully developed using extensive HTML5, CSS3, and JavaScript features, deeply matching modern web standards.
