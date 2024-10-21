document.querySelector('.accept-cookies').addEventListener('click', () => {
  document.querySelector('#cookies-container').classList.add('hidden')
  setCookies('cookiesAccepted', 'true', 30)
})

document.querySelector('.decline-cookies').addEventListener('click', () => {
  document.querySelector('#cookies-container').classList.add('hidden')
})

setCookies = (name, value, days) => {
  let date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  let expires = 'expires=' + date.toUTCString()
  document.cookie = name + '=' + value + ';' + expires + ';path=/'
}

getCookies = (name) => {
  let nameEQ = name + '='
  let ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) == ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

cookieMessage = () => {
  if (!getCookies('cookiesAccepted')) {
    document.querySelector('#cookies-container').classList.remove('hidden')
  }
}

window.addEventListener('load', cookieMessage)
