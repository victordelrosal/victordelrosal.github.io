document.addEventListener('DOMContentLoaded', () => {
    const humanBtn = document.getElementById('human-toggle');
    const agentBtn = document.getElementById('agent-toggle');
    const humanView = document.getElementById('human-view');
    const agentView = document.getElementById('agent-view');
    const body = document.body;

    // Load saved preference
    const savedMode = localStorage.getItem('pascalvdr-view-mode');
    if (savedMode === 'agent') {
        setAgentMode();
    }

    humanBtn.addEventListener('click', setHumanMode);
    agentBtn.addEventListener('click', setAgentMode);

    function setHumanMode() {
        body.classList.remove('agent-mode');
        humanBtn.classList.add('active');
        agentBtn.classList.remove('active');
        humanView.classList.add('active');
        agentView.classList.remove('active');
        localStorage.setItem('pascalvdr-view-mode', 'human');
    }

    function setAgentMode() {
        body.classList.add('agent-mode');
        agentBtn.classList.add('active');
        humanBtn.classList.remove('active');
        agentView.classList.add('active');
        humanView.classList.remove('active');
        localStorage.setItem('pascalvdr-view-mode', 'agent');
    }
});
