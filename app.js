// CollabForge Application Logic

let currentUser = null;
let songs = [];
let authMode = 'signup'; // 'signup' or 'signin'

// Initialize app
async function init() {
    // Check if user is already logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        await loadUserProfile();
        updateAuthUI();
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
            currentUser = session.user;
            await loadUserProfile();
            updateAuthUI();
        } else {
            currentUser = null;
            updateAuthUI();
        }
    });

    await loadSongs();
}

// Load user profile (username)
async function loadUserProfile() {
    const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', currentUser.id)
        .single();

    if (data) {
        currentUser.username = data.username;
    }
}

// Load all songs
async function loadSongs() {
    try {
        const { data, error } = await supabase
            .from('songs')
            .select(`
                *,
                profiles:user_id(username),
                versions(
                    *,
                    profiles:user_id(username),
                    likes:version_likes(count)
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform data to match our format
        songs = data.map(song => ({
            ...song,
            originalAuthor: song.profiles.username,
            versions: song.versions.map(v => ({
                ...v,
                creator: v.profiles.username,
                likes: v.likes[0]?.count || 0,
                likedBy: [] // Will be populated when needed
            })).sort((a, b) => {
                if (a.is_original) return -1;
                if (b.is_original) return 1;
                return b.likes - a.likes;
            })
        }));

        renderSongs();
    } catch (error) {
        console.error('Error loading songs:', error);
        document.getElementById('songsGrid').innerHTML = `
            <div class="error-message">Error loading songs. Please refresh the page.</div>
        `;
    }
}

// Update UI based on auth state
function updateAuthUI() {
    const authBtn = document.getElementById('authBtn');
    const userInfo = document.getElementById('userInfo');
    const uploadSection = document.getElementById('uploadSection');

    if (currentUser && currentUser.username) {
        authBtn.textContent = 'Sign Out';
        authBtn.onclick = signOut;
        userInfo.textContent = `@${currentUser.username}`;
        userInfo.style.display = 'block';
        uploadSection.style.display = 'block';
    } else {
        authBtn.textContent = 'Sign In';
        authBtn.onclick = () => {
            authMode = 'signin';
            updateAuthModal();
            openModal('authModal');
        };
        userInfo.style.display = 'none';
        uploadSection.style.display = 'none';
    }
}

// Update auth modal based on mode
function updateAuthModal() {
    const title = document.getElementById('authModalTitle');
    const submitBtn = document.getElementById('authSubmitBtn');
    const toggleLink = document.getElementById('toggleAuthMode');

    if (authMode === 'signup') {
        title.textContent = 'Join CollabForge';
        submitBtn.textContent = 'Create Account';
        toggleLink.textContent = 'Already have an account? Sign in';
    } else {
        title.textContent = 'Welcome Back';
        submitBtn.textContent = 'Sign In';
        toggleLink.textContent = 'Need an account? Sign up';
        document.getElementById('username').parentElement.style.display = 'none';
    }
}

// Toggle auth mode
document.getElementById('toggleAuthMode').addEventListener('click', (e) => {
    e.preventDefault();
    authMode = authMode === 'signup' ? 'signin' : 'signup';
    document.getElementById('authError').innerHTML = '';
    updateAuthModal();
    
    // Show/hide username field
    const usernameGroup = document.getElementById('username').parentElement;
    usernameGroup.style.display = authMode === 'signup' ? 'block' : 'none';
});

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Auth form handler
document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value;
    const errorDiv = document.getElementById('authError');
    const submitBtn = document.getElementById('authSubmitBtn');

    errorDiv.innerHTML = '';
    submitBtn.disabled = true;

    try {
        if (authMode === 'signup') {
            // Sign up
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email,
                password
            });

            if (signUpError) throw signUpError;

            // Create profile
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    { id: authData.user.id, username, email }
                ]);

            if (profileError) throw profileError;

            errorDiv.innerHTML = '<div class="success-message">Account created! You can now sign in.</div>';
            setTimeout(() => {
                authMode = 'signin';
                updateAuthModal();
                document.getElementById('authForm').reset();
                errorDiv.innerHTML = '';
            }, 2000);

        } else {
            // Sign in
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            closeModal('authModal');
            document.getElementById('authForm').reset();
        }
    } catch (error) {
        errorDiv.innerHTML = `<div class="error-message">${error.message}</div>`;
    } finally {
        submitBtn.disabled = false;
    }
});

// Sign out
async function signOut() {
    await supabase.auth.signOut();
    currentUser = null;
    updateAuthUI();
    await loadSongs();
}

// Upload form handler
let pendingUpload = null;

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentUser) return;

    const title = document.getElementById('songTitle').value;
    const description = document.getElementById('songDescription').value;
    const file = document.getElementById('audioFile').files[0];

    // Store the upload data
    pendingUpload = { title, description, file };

    // Show confirmation modal
    document.getElementById('confirmTitle').textContent = title;
    openModal('releaseModal');
});

// Enable/disable confirm button based on checkbox
document.getElementById('confirmCheckbox').addEventListener('change', (e) => {
    document.getElementById('confirmReleaseBtn').disabled = !e.target.checked;
});

// Confirm release
async function confirmRelease() {
    if (!pendingUpload) return;

    const { title, description, file } = pendingUpload;
    const uploadBtn = document.getElementById('confirmReleaseBtn');
    const errorDiv = document.getElementById('uploadError');

    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';
    errorDiv.innerHTML = '';

    try {
        // Upload audio file to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `songs/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('audio')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('audio')
            .getPublicUrl(filePath);

        // Create song record
        const { data: songData, error: songError } = await supabase
            .from('songs')
            .insert([
                {
                    title,
                    description,
                    user_id: currentUser.id,
                    is_complete: false
                }
            ])
            .select()
            .single();

        if (songError) throw songError;

        // Create original version
        const { error: versionError } = await supabase
            .from('versions')
            .insert([
                {
                    song_id: songData.id,
                    user_id: currentUser.id,
                    audio_url: publicUrl,
                    is_original: true,
                    notes: 'Original version'
                }
            ]);

        if (versionError) throw versionError;

        // Success!
        closeModal('releaseModal');
        document.getElementById('uploadForm').reset();
        document.getElementById('confirmCheckbox').checked = false;
        pendingUpload = null;

        // Reload songs
        await loadSongs();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        console.error('Upload error:', error);
        errorDiv.innerHTML = `<div class="error-message">Upload failed: ${error.message}</div>`;
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Let It Go →';
    }
}

// Render all songs
function renderSongs() {
    const grid = document.getElementById('songsGrid');
    
    if (songs.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <p>No songs yet. Be the first to let go.</p>
                ${!currentUser ? '<p style="font-size: 0.9rem;">Sign in to upload your first track</p>' : ''}
            </div>
        `;
        return;
    }

    grid.innerHTML = songs.map(song => renderSong(song)).join('');
}

// Render individual song
function renderSong(song) {
    const sortedVersions = song.versions;
    const topVersions = sortedVersions.slice(0, 11);
    const hiddenVersions = sortedVersions.slice(11);
    const hasHiddenVersions = hiddenVersions.length > 0;

    return `
        <div class="song-card ${song.is_complete ? 'complete' : ''}" data-song-id="${song.id}">
            <div class="song-header">
                <div>
                    <h3 class="song-title">${song.title}</h3>
                    <div class="song-meta">
                        by @${song.originalAuthor} · ${formatDate(song.created_at)}
                        ${song.is_complete ? ' · Ready for distribution' : ''}
                    </div>
                </div>
            </div>
            
            ${song.description ? `<p class="song-description">${song.description}</p>` : ''}
            
            <div class="versions-section">
                <div class="versions-header">
                    <span>${song.versions.length} version${song.versions.length !== 1 ? 's' : ''}</span>
                    ${currentUser ? `<button onclick="showRemixForm('${song.id}')" style="font-size: 0.85rem; padding: 0.4rem 1rem;">+ Add Your Version</button>` : ''}
                </div>
                
                <div id="versions-${song.id}">
                    ${topVersions.map(version => renderVersion(song.id, version)).join('')}
                    
                    ${hasHiddenVersions ? `
                        <div class="show-more">
                            <button onclick="toggleHiddenVersions('${song.id}')">
                                Show ${hiddenVersions.length} more version${hiddenVersions.length !== 1 ? 's' : ''}
                            </button>
                        </div>
                        <div id="hidden-versions-${song.id}" style="display: none;">
                            ${hiddenVersions.map(version => renderVersion(song.id, version)).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <div id="remix-form-${song.id}" style="display: none;"></div>
            </div>
        </div>
    `;
}

// Render version
function renderVersion(songId, version) {
    return `
        <div class="version-item ${version.is_original ? 'original' : ''}">
            <div class="version-header">
                <div class="version-by">
                    ${version.is_original ? '' : 'Remix by '}@${version.creator}
                    ${version.notes ? ` · ${version.notes}` : ''}
                </div>
                <button class="like-btn" 
                        onclick="toggleLike('${songId}', '${version.id}')"
                        ${!currentUser ? 'disabled' : ''}>
                    ♡ ${version.likes}
                </button>
            </div>
            <div class="audio-player">
                <audio controls>
                    <source src="${version.audio_url}" type="audio/mpeg">
                </audio>
            </div>
            <div style="font-family: 'Space Mono', monospace; font-size: 0.75rem; opacity: 0.5; margin-top: 0.5rem;">
                ${formatDate(version.created_at)}
            </div>
        </div>
    `;
}

// Toggle like
async function toggleLike(songId, versionId) {
    if (!currentUser) return;

    try {
        // Check if already liked
        const { data: existingLike } = await supabase
            .from('version_likes')
            .select('id')
            .eq('version_id', versionId)
            .eq('user_id', currentUser.id)
            .single();

        if (existingLike) {
            // Unlike
            await supabase
                .from('version_likes')
                .delete()
                .eq('id', existingLike.id);
        } else {
            // Like
            await supabase
                .from('version_likes')
                .insert([{ version_id: versionId, user_id: currentUser.id }]);
        }

        // Reload songs to update like counts
        await loadSongs();

        // Check if any version hit 1000 likes (mark song complete)
        const song = songs.find(s => s.id === songId);
        if (song && !song.is_complete) {
            const hasCompletedVersion = song.versions.some(v => v.likes >= 1000);
            if (hasCompletedVersion) {
                await supabase
                    .from('songs')
                    .update({ is_complete: true })
                    .eq('id', songId);
                await loadSongs();
            }
        }

    } catch (error) {
        console.error('Error toggling like:', error);
    }
}

// Show remix form
function showRemixForm(songId) {
    const formContainer = document.getElementById(`remix-form-${songId}`);
    
    if (formContainer.style.display === 'none') {
        formContainer.style.display = 'block';
        formContainer.innerHTML = `
            <div class="remix-form">
                <h4>Add Your Version</h4>
                <div id="remix-error-${songId}"></div>
                <form onsubmit="submitRemix(event, '${songId}')">
                    <div class="form-group">
                        <label>What did you change? (Optional)</label>
                        <input type="text" id="remix-notes-${songId}" placeholder="e.g., Added drums, Changed to minor key, Wrote new verses">
                    </div>
                    <div class="form-group">
                        <label>Upload Your Version</label>
                        <div class="file-upload">
                            <input type="file" id="remix-file-${songId}" accept="audio/*" required>
                            <div class="file-upload-text">
                                <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🎵</div>
                                <div>Upload your remix</div>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button type="submit" class="primary" id="remix-submit-${songId}">Submit Version</button>
                        <button type="button" onclick="hideRemixForm('${songId}')">Cancel</button>
                    </div>
                </form>
            </div>
        `;
    } else {
        hideRemixForm(songId);
    }
}

// Hide remix form
function hideRemixForm(songId) {
    document.getElementById(`remix-form-${songId}`).style.display = 'none';
}

// Submit remix
async function submitRemix(event, songId) {
    event.preventDefault();
    
    const notes = document.getElementById(`remix-notes-${songId}`).value;
    const file = document.getElementById(`remix-file-${songId}`).files[0];
    const submitBtn = document.getElementById(`remix-submit-${songId}`);
    const errorDiv = document.getElementById(`remix-error-${songId}`);

    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading...';
    errorDiv.innerHTML = '';

    try {
        // Upload audio file
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `songs/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('audio')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('audio')
            .getPublicUrl(filePath);

        // Create version
        const { error: versionError } = await supabase
            .from('versions')
            .insert([
                {
                    song_id: songId,
                    user_id: currentUser.id,
                    audio_url: publicUrl,
                    is_original: false,
                    notes: notes || ''
                }
            ]);

        if (versionError) throw versionError;

        // Success!
        hideRemixForm(songId);
        await loadSongs();

    } catch (error) {
        console.error('Remix upload error:', error);
        errorDiv.innerHTML = `<div class="error-message">Upload failed: ${error.message}</div>`;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Version';
    }
}

// Toggle hidden versions
function toggleHiddenVersions(songId) {
    const hiddenSection = document.getElementById(`hidden-versions-${songId}`);
    const button = event.target;
    
    if (hiddenSection.style.display === 'none') {
        hiddenSection.style.display = 'block';
        button.textContent = 'Show less';
    } else {
        hiddenSection.style.display = 'none';
        const count = hiddenSection.children.length;
        button.textContent = `Show ${count} more version${count !== 1 ? 's' : ''}`;
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Initialize on load
init();
