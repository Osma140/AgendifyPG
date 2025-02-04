document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("create-timer-form")
  const timersContainer = document.querySelector(".timers-grid")
  const themeToggle = document.getElementById("theme-toggle")

  function loadTimersFromStorage() {
    if (!timersContainer) return // Si no estamos en la página de temporizadores, no hacemos nada
    const timers = JSON.parse(localStorage.getItem("timers")) || []
    timersContainer.innerHTML = ""
    timers.forEach((timer) => createTimerCard(timer))
  }

  function saveTimersToStorage(timers) {
    localStorage.setItem("timers", JSON.stringify(timers))
  }

  function createTimerCard(timer) {
    if (!timersContainer) return // Si no estamos en la página de temporizadores, no hacemos nada
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
          <button class="delete-button" data-id="${timer.id}"><i class="fas fa-trash"></i> Eliminar</button>
          <button class="sound-button" data-sound="${timer.Sound}"><i class="fas fa-volume-up"></i> Probar Sonido</button>
        </div>
      `

    timersContainer.appendChild(timerCard)

    const deleteButton = timerCard.querySelector(".delete-button")
    deleteButton.addEventListener("click", () => deleteTimer(timer.id))

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
        playSound(soundFile)
      }
      timerCard.querySelector(".timer-display").innerHTML = "<p>Evento finalizado</p>"
      return
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

    timerCard.querySelector(".days").textContent = days.toString().padStart(2, "0")
    timerCard.querySelector(".hours").textContent = hours.toString().padStart(2, "0")
    timerCard.querySelector(".minutes").textContent = minutes.toString().padStart(2, "0")
    timerCard.querySelector(".seconds").textContent = seconds.toString().padStart(2, "0")
  }

  function deleteTimer(id) {
    let timers = JSON.parse(localStorage.getItem("timers")) || []
    timers = timers.filter((timer) => timer.id !== id)
    saveTimersToStorage(timers)
    loadTimersFromStorage()
  }

  function showNotification(message, type) {
    const notification = document.createElement("div")
    notification.className = `notification ${type}`
    notification.textContent = message

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.classList.add("show")
    }, 10)

    setTimeout(() => {
      notification.classList.remove("show")
      setTimeout(() => {
        notification.remove()
      }, 300)
    }, 3000)
  }

  let currentAudio = null

  function playSound(soundFile) {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
    }

    console.log("Intentando reproducir:", soundFile)

    const audio = new Audio(soundFile)
    currentAudio = audio

    audio
      .play()
      .then(() => {
        console.log("Reproducción iniciada")
      })
      .catch((error) => {
        console.error("Error al reproducir el sonido:", error)
        showNotification(
          "Error al reproducir el sonido. Por favor, verifica la configuración de tu navegador.",
          "error",
        )
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
    })
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
