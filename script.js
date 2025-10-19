/* script.js
   Checkbox + reminders + popups + desktop notifications.
   Expects these IDs in index.html:
   taskList, emptyMsg, addBtn, taskText, taskDate, successPopup, angryPopup
*/

document.addEventListener('DOMContentLoaded', function(){
  const storageKey = 'my_todo_list_v1';
  const taskListEl = document.getElementById('taskList');
  const emptyMsg = document.getElementById('emptyMsg');
  const addBtn = document.getElementById('addBtn');
  const taskText = document.getElementById('taskText');
  const taskDate = document.getElementById('taskDate');

  const successPopup = document.getElementById('successPopup');
  const angryPopup = document.getElementById('angryPopup');

  if(!taskListEl || !emptyMsg || !addBtn || !taskText || !taskDate || !successPopup || !angryPopup){
    console.warn('script.js: one or more expected DOM elements are missing. Check IDs in index.html.');
    return;
  }

  // CONFIG
  const nearMs = 24 * 60 * 60 * 1000; // reminder window (24 hours)
  const reminderIntervalMs = 60 * 1000; // check every minute
  // END CONFIG

  let tasks = loadTasks();
  const reminded = new Set();
  const beep = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='); // placeholder

  function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
  function saveTasks(){ localStorage.setItem(storageKey, JSON.stringify(tasks)); }
  function loadTasks(){ try { return JSON.parse(localStorage.getItem(storageKey)) || []; } catch(e){ return []; } }

  function addTask(){
    const title = taskText.value.trim();
    const date = taskDate.value || null;
    if(!title) return alert('Please enter a task title.');
    const t = { id: uid(), title, due: date, done: false, created: new Date().toISOString() };
    tasks.unshift(t);
    saveTasks();
    taskText.value = ''; taskDate.value = '';
    render();
  }

  function toggleDone(id, checked){
    const t = tasks.find(x => x.id === id);
    if(!t) return;
    t.done = !!checked;
    if(t.done) reminded.delete(t.id);
    saveTasks();
    render();
    if(t.done) showSuccess();
  }

  function removeTask(id){
    tasks = tasks.filter(x => x.id !== id);
    reminded.delete(id);
    saveTasks();
    render();
  }

  function formatDate(d){
    if(!d) return 'No due date';
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString();
  }

  // milliseconds until end of selected day (23:59:59)
  function timeUntil(d){
    if(!d) return Infinity;
    const then = new Date(d + 'T23:59:59');
    return then - new Date();
  }

  function render(){
    taskListEl.innerHTML = '';
    if(tasks.length === 0){ emptyMsg.style.display = 'block'; return; } else emptyMsg.style.display = 'none';

    tasks.forEach(task => {
      const el = document.createElement('div'); el.className = 'task fade-in';
      const left = document.createElement('div'); left.className = 'left';

      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!task.done;
      cb.setAttribute('aria-label','Mark task as done');
      cb.addEventListener('change', (e) => toggleDone(task.id, e.target.checked));
      cb.style.width='18px'; cb.style.height='18px'; cb.style.cursor='pointer';

      const info = document.createElement('div');
      const title = document.createElement('div'); title.className='title'; title.textContent = task.title;
      const meta = document.createElement('div'); meta.className='meta'; meta.textContent = formatDate(task.due);

      info.appendChild(title); info.appendChild(meta);
      left.appendChild(cb); left.appendChild(info);

      const right = document.createElement('div');
      right.style.display='flex'; right.style.alignItems='center'; right.style.gap='8px';

      const timeLeft = timeUntil(task.due);
      const isNear = !task.done && timeLeft !== Infinity && timeLeft <= nearMs && timeLeft > 0;
      if(isNear){
        const near = document.createElement('div'); near.className='badge near'; near.textContent='DUE SOON';
        near.style.cursor='pointer';
        near.title = 'This task is nearing its due date.';
        near.addEventListener('click', ()=> showAngry(task));
        right.appendChild(near);
      }

      if(task.done){
        const done = document.createElement('div'); done.className='badge done'; done.textContent='COMPLETED'; right.appendChild(done);
        title.style.textDecoration='line-through'; title.style.opacity='0.8';
      }

      const del = document.createElement('button'); del.textContent='Delete';
      del.style.background='transparent'; del.style.border='1px solid rgba(255,255,255,0.04)';
      del.style.padding='6px 8px'; del.style.borderRadius='8px';
      del.addEventListener('click', ()=> removeTask(task.id));
      right.appendChild(del);

      el.appendChild(left); el.appendChild(right);
      taskListEl.appendChild(el);
    });

    // show angry popup once for the first near task on render
    const nearTask = tasks.find(t => !t.done && timeUntil(t.due) !== Infinity && timeUntil(t.due) <= nearMs && timeUntil(t.due) > 0);
    if(nearTask) setTimeout(()=> showAngry(nearTask), 700);
  }

  function showSuccess(){
    const subtitle = successPopup.querySelector('.subtitle');
    if(subtitle) subtitle.textContent = 'keep up the goodwork';
    successPopup.style.display = 'flex'; successPopup.classList.remove('shake');
    setTimeout(()=> successPopup.classList.add('fade-in'), 20);
    setTimeout(()=> successPopup.style.display = 'none', 2200);
  }

  function showAngry(task){
    const subtitle = angryPopup.querySelector('.subtitle');
    if(subtitle) subtitle.textContent = `"${task.title}" is due ${task.due ? formatDate(task.due) : 'soon'}. Finish it now!`;
    angryPopup.style.display = 'flex'; angryPopup.classList.remove('shake');
    setTimeout(()=> angryPopup.classList.add('shake'), 50);
    setTimeout(()=> { angryPopup.style.display = 'none'; angryPopup.classList.remove('shake'); }, 3200);
  }

  function sendDesktopNotification(title, body){
    if(!('Notification' in window)) return;
    if(Notification.permission === 'granted') new Notification(title, { body });
    else if(Notification.permission !== 'denied'){
      Notification.requestPermission().then(perm => { if(perm === 'granted') new Notification(title, { body }); });
    }
  }

  function checkReminders(){
    tasks.forEach(t => {
      if(t.done) return;
      if(reminded.has(t.id)) return;
      const msUntil = timeUntil(t.due);
      if(msUntil !== Infinity && msUntil > 0 && msUntil <= nearMs){
        showAngry(t);
        sendDesktopNotification('Task due soon', `${t.title} is due ${t.due ? formatDate(t.due) : 'soon'}`);
        // beep.play().catch(()=>{});
        reminded.add(t.id);
      }
    });
  }

  const reminderTimer = setInterval(checkReminders, reminderIntervalMs);
  window.addEventListener('beforeunload', () => { clearInterval(reminderTimer); });

  addBtn.addEventListener('click', addTask);
  taskText.addEventListener('keydown', (e) => { if(e.key === 'Enter') addTask(); });

  render();
  setTimeout(checkReminders, 900);
  window.addEventListener('storage', () => { tasks = loadTasks(); render(); });
});
