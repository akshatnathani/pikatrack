'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('setup-form');
  const btnSave = document.getElementById('btn-save');
  const formView = document.getElementById('form-view');
  const successView = document.getElementById('success-view');
  const displayName = document.getElementById('trainer-display-name');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Disable button to prevent double submit
    btnSave.disabled = true;
    btnSave.textContent = 'Configuring...';

    const fields = {
      trainerName: document.getElementById('trainer-name').value.trim() || 'Red',
      leetcodeUsername: document.getElementById('leetcode-username').value.trim(),
      githubUsername: document.getElementById('github-username').value.trim(),
      codeforcesHandle: document.getElementById('codeforces-handle').value.trim(),
      codechefHandle: document.getElementById('codechef-handle').value.trim(),
      hackerrankUsername: document.getElementById('hackerrank-username').value.trim(),
      onboarded: true
    };

    // Update Profile variables inside background / db
    chrome.runtime.sendMessage({ type: 'UPDATE_PROFILE', fields }, (response) => {
      // Trigger initial profile account sync
      chrome.runtime.sendMessage({ type: 'SYNC_ACCOUNTS' }, () => {
        // Show success screen
        displayName.textContent = fields.trainerName;
        formView.style.display = 'none';
        successView.style.display = 'block';
      });
    });
  });
});
