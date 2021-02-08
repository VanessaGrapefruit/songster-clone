import { Difficulty } from '../models/Difficulty';
import { Genre } from '../models/Genre';
import { serverUrl } from '../models/Constants';
import Store, { EVENTS } from './Store';
import renderElement from './helpers/renderElements';
import { SVG_SPRITE } from './helpers/svg_sprites';
import validateFileType from './helpers/validateFileType';

const SHOW = '--show';

interface FormUploadMedia {
  element: HTMLFormElement;
  name: HTMLInputElement;
  author: HTMLInputElement;
  genreInput: HTMLSelectElement;
  difficultyInput: HTMLSelectElement;
  uploadFileError: HTMLElement;
}

export default class AddForm {
  parentElement: HTMLElement;
  formContainer: HTMLElement;
  formOverlay: HTMLElement;
  dropArea: HTMLElement;
  inputUpload: HTMLInputElement;
  store: Store;

  constructor(parentElement: HTMLElement, store: Store) {
    this.parentElement = parentElement;
    this.store = store;
    this.renderForm = this.renderForm.bind(this);
    this.hideForm = this.hideForm.bind(this);
    this.activeArea = this.activeArea.bind(this);
    this.formContainer;
    this.formOverlay;
    this.dropArea;
    this.inputUpload;
  }

  renderInput(parentElement: HTMLElement, name: string, labelText: string, type?: string) {
    const label = renderElement(parentElement, 'label', [], labelText) as HTMLLabelElement;
    label.htmlFor = name;

    const input = renderElement(parentElement, 'input', []) as HTMLInputElement;
    input.name = name;
    input.type = type;
    input.required = true;

    return input;
  }

  render() {
    this.formContainer = renderElement(this.parentElement, 'div', ['wrapper-user__form-container']);
    this.formOverlay = renderElement(this.parentElement, 'div', ['wrapper-user__form-overlay']);
    this.formOverlay.addEventListener('click', this.hideForm);

    const formUpload = this.renderForm();
    formUpload.element.addEventListener('submit', (event: Event) => {
      this.handleFileUpload(formUpload, event);
    });
  }

  renderForm() {
    this.formOverlay.classList.add(SHOW);
    this.formContainer.classList.add(SHOW);
    this.formContainer.innerHTML = '';

    const formSendFile = renderElement(this.formContainer, 'form', ['form-add']) as HTMLFormElement;

    const name = this.renderInput(formSendFile, 'name', 'Song Title', 'text') as HTMLInputElement;
    name.setAttribute('value', 'Enter Song title...');

    const nameError = renderElement(formSendFile, 'div', ['form-add__name-error']);
    nameError.textContent = '';

    name.addEventListener('focus', () => {
      name.removeAttribute('value');
    });

    const optionsContainer = renderElement(formSendFile, 'div', ['options-container']);
    const genreInput = this.renderOptionSelectAndGet(Genre, 'Genre', optionsContainer);
    const difficultyInput = this.renderOptionSelectAndGet(
      Difficulty,
      'Difficulty',
      optionsContainer,
    );

    const authorTitle = renderElement(formSendFile, 'div', ['author__title'], 'Author');
    const author = renderElement(
      formSendFile,
      'textarea',
      ['input__author'],
      'Enter the author...',
    ) as HTMLInputElement;

    author.setAttribute('value', 'Enter the author...');
    author.addEventListener('focus', () => {
      author.textContent = '';
    });

    const authorError = renderElement(formSendFile, 'div', ['form-add__name-error']);
    authorError.textContent = '';

    this.renderUploadForm(formSendFile);
    const uploadFileError = renderElement(formSendFile, 'div', ['form-add__file-error']);

    const buttonContainer = renderElement(formSendFile, 'div', ['form-add__button-container']);
    const buttonSubmit = renderElement(buttonContainer, 'button', ['button-submit'], 'Submit');

    const buttonCancel = renderElement(buttonContainer, 'button', ['button-cancel'], 'Cancel');
    buttonCancel.addEventListener('click', this.hideForm);

    return { element: formSendFile, name, author, genreInput, difficultyInput, uploadFileError };
  }

  handleFileUpload(formUpload: FormUploadMedia, event: Event) {
    event.preventDefault();

    const formData = new FormData();
    let inputFile = this.inputUpload.files[0];

    if (inputFile && validateFileType(inputFile)) {
      formData.append('midi', inputFile);
    } else {
      this.inputUpload.value = '';
      this.dropArea.classList.remove('drop-area__over');
      formUpload.uploadFileError.innerText = 'Invalid file format. Supported format is .mid';
      return;
    }

    const genre = formUpload.genreInput.options[formUpload.genreInput.selectedIndex].value;
    const difficulty =
      formUpload.difficultyInput.options[formUpload.difficultyInput.selectedIndex].value;

    formData.append('name', formUpload.name.value);
    formData.append('author', formUpload.author.value);
    formData.append('genre', genre);
    formData.append('difficulty', difficulty);

    this.addSong(formData);
  }

  async addSong(formData: FormData) {
    const res = await fetch(`${serverUrl}/addSong`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (data.songID) {
      this.store.selectSong(data.songID);
      this.hideForm();
    }
  }

  renderOptionSelectAndGet(e: any, name: string, parentElement: HTMLElement) {
    const select = document.createElement('select');
    select.required = true;

    const option = document.createElement('option');
    option.text = name;
    option.selected = true;
    option.disabled = true;

    select.options.add(option);

    for (const value of Object.keys(e)) {
      const option = document.createElement('option');
      option.text = value;
      option.value = value;
      select.options.add(option);
    }

    parentElement.appendChild(select);
    return select;
  }

  hideForm() {
    this.formOverlay.classList.remove(SHOW);
    this.formContainer.classList.remove(SHOW);
  }

  renderUploadForm(parentElement: HTMLElement) {
    this.dropArea = renderElement(parentElement, 'div', ['drop-area']);
    const dropAreaImage = renderElement(this.dropArea, 'div', ['drop-area__image']);
    dropAreaImage.innerHTML = SVG_SPRITE.UPLOAD;

    this.inputUpload = this.renderInput(this.dropArea, 'input', 'Drop your file here', 'file');
    this.inputUpload.accept = '.mid';
    this.inputUpload.classList.add('drop-area__input');

    const dropAreaElement = this.inputUpload.closest('.drop-area');

    dropAreaElement.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropAreaElement.classList.add('drop-area__over');
    });

    ['dragleave', 'dragend'].forEach((type) => {
      dropAreaElement.addEventListener(type, (e) => {
        dropAreaElement.classList.remove('drop-area__over');
      });
    });

    dropAreaElement.addEventListener('drop', (e: DragEvent) => {
      this.dropHandler(e);
    });
  }

  dropHandler(ev: DragEvent) {
    ev.preventDefault();

    if (ev.dataTransfer.items) {
      // Use DataTransferItemList interface to access the file(s)
      for (let i = 0; i < ev.dataTransfer.items.length; i++) {
        // If dropped items aren't files, reject them
        if (ev.dataTransfer.items[i].kind === 'file') {
          this.inputUpload.files = ev.dataTransfer.files;
        }
      }
    }
  }

  activeArea() {
    this.dropArea.classList.add('.drop-area__over');
  }
}
