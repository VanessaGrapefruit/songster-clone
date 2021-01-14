export default class Login {
  parentElement: HTMLElement;

  constructor(parentElement: HTMLElement) {
    this.parentElement = parentElement;
  }

  render() {
    const loginButton = document.createElement('button');
    loginButton.className = 'wrapper-user-login';
    this.parentElement.appendChild(loginButton);
  }
}
