document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("create-timer-form")
  const timersContainer = document.querySelector(".timers-grid")
  const themeToggle = document.getElementById("theme-toggle")

  // Solicitar permiso para notificaciones
  if ("Notification" in window) {
    Notification.requestPermission()
  }

  // Registrar el Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").then(() => {
      console.log("Service Worker registrado")
    })
  }

  function loadTimersFromStorage() {
    if (!timersContainer) return
    const timers = JSON.parse(localStorage.getItem("timers")) || []
    timersContainer.innerHTML = ""
    timers.forEach((timer) => createTimerCard(timer))
  }

  function saveTimersToStorage(timers) {
    localStorage.setItem("timers", JSON.stringify(timers))
  }

  function createTimerCard(timer) {
    if (!timersContainer) return
    const timerCard = document.createElement("div")
    timerCard.classList.add("timer-card")
    timerCard.setAttribute("data-id", timer.id)
    timerCard.setAttribute("data-end-time", new Date(timer.FechaHora).getTime())
    timerCard.setAttribute("data-sound", timer.Sound)

    const now = new Date().getTime()
    const endTime = new Date(timer.FechaHora).getTime()
    if (endTime <= now) {
      timerCard.setAttribute("data-finished", "true")
    }

    timerCard.innerHTML = `
      <h3><i class="fas fa-hourglass-start"></i> ${timer.NombreEvento}</h3>
      <div class="timer-display">
        <div class="timer-unit">
          <span class="days">00</span>
          <small>Días</small>
        </div>
        <div class="timer-unit">
          <span class="hours">00</span>
          <small>Horas</small>
        </div>
        <div class="timer-unit">
          <span class="minutes">00</span>
          <small>Minutos</small>
        </div>
        <div class="timer-unit">
          <span class="seconds">00</span>
          <small>Segundos</small>
        </div>
      </div>
      <div class="timer-actions">
        <button class="edit-button" data-id="${timer.id}"><i class="fas fa-edit"></i> Editar</button>
        <button class="delete-button" data-id="${timer.id}"><i class="fas fa-trash"></i> Eliminar</button>
        <button class="sound-button" data-sound="${timer.Sound}"><i class="fas fa-volume-up"></i> Probar Sonido</button>
      </div>
    `

    timersContainer.appendChild(timerCard)

    const deleteButton = timerCard.querySelector(".delete-button")
    deleteButton.addEventListener("click", () => deleteTimer(timer.id))

    const editButton = timerCard.querySelector(".edit-button")
    editButton.addEventListener("click", () => openEditModal(timer))

    const soundButton = timerCard.querySelector(".sound-button")
    soundButton.addEventListener("click", () => {
      const soundFile = timer.Sound
      playSound(soundFile)
    })

    updateTimer(timerCard)
  }

  function updateTimer(timerCard) {
    const endTime = Number.parseInt(timerCard.getAttribute("data-end-time"))
    const now = new Date().getTime()
    const timeLeft = endTime - now

    if (timeLeft <= 0) {
      if (!timerCard.hasAttribute("data-finished")) {
        timerCard.setAttribute("data-finished", "true")
        const soundFile = timerCard.getAttribute("data-sound")
        const timerName = timerCard.querySelector("h3").textContent
        playSound(soundFile)
        showNotification(timerName)
      }
      timerCard.querySelector(".timer-display").innerHTML = "<p>Evento finalizado</p>"
      return
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

    const updateElement = (selector, value) => {
      const element = timerCard.querySelector(selector)
      if (element.textContent !== value) {
        element.textContent = value
      }
    }

    updateElement(".days", days.toString().padStart(2, "0"))
    updateElement(".hours", hours.toString().padStart(2, "0"))
    updateElement(".minutes", minutes.toString().padStart(2, "0"))
    updateElement(".seconds", seconds.toString().padStart(2, "0"))
  }

  function deleteTimer(id) {
    let timers = JSON.parse(localStorage.getItem("timers")) || []
    timers = timers.filter((timer) => timer.id !== id)
    saveTimersToStorage(timers)
    loadTimersFromStorage()
  }

  function showNotification(timerName) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Temporizador finalizado", {
        body: `El temporizador "${timerName}" ha terminado.`,
        icon: "icon/icon.ico",
      })
    }
  }

  let currentAudio = null

  function playSound(soundFile) {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
    }

    const audio = new Audio(soundFile)
    currentAudio = audio

    audio.play().catch((error) => {
      console.error("Error al reproducir el sonido:", error)
      showNotification("Error al reproducir el sonido. Por favor, verifica la configuración de tu navegador.", "error")
    })
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault()
      const formData = new FormData(form)
      const newTimer = {
        id: Date.now(),
        NombreEvento: formData.get("Name"),
        FechaHora: formData.get("FechaHora"),
        Sound: formData.get("Sound"),
      }

      const timers = JSON.parse(localStorage.getItem("timers")) || []
      timers.push(newTimer)
      saveTimersToStorage(timers)

      form.reset()
      showNotification("Temporizador creado exitosamente", "success")
      scheduleNotification(newTimer)
    })
  }

  function scheduleNotification(timer) {
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.sync.register("schedule-notification").then(() => {
          console.log("Notificación programada")
        })
      })
    }
  }

  function openEditModal(timer) {
    const modal = document.createElement("div")
    modal.classList.add("modal")
    modal.innerHTML = `
      <div class="modal-content">
        <h2>Editar Temporizador</h2>
        <form id="edit-timer-form">
          <input type="hidden" name="id" value="${timer.id}">
          <div class="form-group">
            <label for="edit-event-name">Nombre del Evento:</label>
            <input type="text" id="edit-event-name" name="Name" value="${timer.NombreEvento}" required>
          </div>
          <div class="form-group">
            <label for="edit-event-date">Fecha y Hora del Evento:</label>
            <input type="datetime-local" id="edit-event-date" name="FechaHora" value="${timer.FechaHora.slice(0, 16)}" required>
          </div>
          <div class="form-group">
            <label for="edit-event-sound">Sonido de Alarma:</label>
            <select id="edit-event-sound" name="Sound" required>
              <option value="sonido/sonido1.mp3" ${timer.Sound === "sonido/sonido1.mp3" ? "selected" : ""}>Alarma 1</option>
              <option value="sonido/sonido2.mp3" ${timer.Sound === "sonido/sonido2.mp3" ? "selected" : ""}>Alarma 2</option>
              <option value="sonido/sonido3.mp3" ${timer.Sound === "sonido/sonido3.mp3" ? "selected" : ""}>Alarma 3</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="submit">Guardar Cambios</button>
            <button type="button" id="cancel-edit">Cancelar</button>
          </div>
        </form>
      </div>
    `

    document.body.appendChild(modal)

    const editForm = document.getElementById("edit-timer-form")
    const cancelButton = document.getElementById("cancel-edit")

    editForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const formData = new FormData(editForm)
      const updatedTimer = {
        id: Number(formData.get("id")),
        NombreEvento: formData.get("Name"),
        FechaHora: formData.get("FechaHora"),
        Sound: formData.get("Sound"),
      }

      let timers = JSON.parse(localStorage.getItem("timers")) || []
      timers = timers.map((t) => (t.id === updatedTimer.id ? updatedTimer : t))
      saveTimersToStorage(timers)
      loadTimersFromStorage()
      closeModal(modal)
      showNotification("Temporizador actualizado exitosamente", "success")
      scheduleNotification(updatedTimer)
    })

    cancelButton.addEventListener("click", () => closeModal(modal))
  }

  function closeModal(modal) {
    modal.remove()
  }

  loadTimersFromStorage()
  if (timersContainer) {
    setInterval(() => {
      document.querySelectorAll(".timer-card").forEach(updateTimer)
    }, 1000)
  }

  // Theme toggle functionality
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode")
    localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light")
  })

  // Check for saved theme preference or prefer-color-scheme
  const savedTheme = localStorage.getItem("theme")
  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)")

  if (savedTheme === "dark" || (savedTheme === null && prefersDarkScheme.matches)) {
    document.body.classList.add("dark-mode")
  }

  // Actualizar la clase 'active' en la navegación
  const navItems = document.querySelectorAll(".nav-item")
  navItems.forEach((item) => {
    if (item.getAttribute("href") === location.pathname.split("/").pop()) {
      item.classList.add("active")
    } else {
      item.classList.remove("active")
    }
  })

  const downloadButton = document.getElementById("download-apk")
  if (downloadButton) {
    downloadButton.addEventListener("click", () => {
      const confirmDownload = confirm(
        "Advertencia: La aplicación está en modo beta y puede presentar fallos. ¿Desea continuar con la descarga?",
      )
      if (confirmDownload) {
        const apkUrl = "apk/Agendify.apk"
        const link = document.createElement("a")
        link.href = apkUrl
        link.download = "Agendify.apk"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        showNotification("La descarga comenzará en breve. Gracias por tu interés en nuestra aplicación.", "success")
      }
    })
  }
})
