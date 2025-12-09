const users = [
  { email: "jguilindo@gmail.com", password: "123456" }
];

document.getElementById("loginForm").addEventListener("submit", e => {
  e.preventDefault();

  const email = email.value;
  const password = password.value;

  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    alert("Login inválido");
    return;
  }

  localStorage.setItem("user", email);
  window.location.href = "index.html";
});
