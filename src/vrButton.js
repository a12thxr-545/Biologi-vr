export class VRButton {
  static createButton(renderer) {
    const button = document.createElement('button');

    function showEnterVR() {
      let currentSession = null;

      async function onSessionStarted(session) {
        session.addEventListener('end', onSessionEnded);
        await renderer.xr.setSession(session);
        button.textContent = 'EXIT VR';
        currentSession = session;
      }

      function onSessionEnded() {
        currentSession.removeEventListener('end', onSessionEnded);
        button.textContent = 'ENTER VR';
        currentSession = null;
      }

      button.style.display = '';
      button.style.cursor = 'pointer';
      button.textContent = 'ENTER VR';

      button.onmouseenter = function () {
        button.style.opacity = '1.0';
      };
      button.onmouseleave = function () {
        button.style.opacity = '0.85';
      };

      button.onclick = function () {
        if (currentSession === null) {
          const sessionInit = { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'layers'] };
          navigator.xr.requestSession('immersive-vr', sessionInit).then(onSessionStarted);
        } else {
          currentSession.end();
        }
      };
    }

    function disableButton() {
      button.style.display = '';
      button.style.cursor = 'auto';
      button.style.opacity = '0.5';
      button.textContent = 'VR NOT SUPPORTED';
      button.onclick = null;
    }

    if ('xr' in navigator) {
      button.id = 'vr-button';
      button.style.display = 'none';

      navigator.xr.isSessionSupported('immersive-vr').then(supported => {
        supported ? showEnterVR() : disableButton();
      }).catch(disableButton);

      return button;
    } else {
      const message = document.createElement('button');
      message.id = 'vr-button';
      message.textContent = 'VR READY (NO HEADSET)';
      message.style.opacity = '0.6';
      return message;
    }
  }
}
