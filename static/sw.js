if (window.navigator && navigator.serviceWorker) {
  window.navigator.serviceWorker.getRegistrations().then((registrations) => {
    if (registrations.length > 0) {
      Promise.all(registrations.map((r) => r.unregister())).then(() =>
        window.location.reload()
      );
    }
  });
}
