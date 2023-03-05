import { NetworkError, EmptyInputError, CacheError } from './errors.js';
import './modal-notice.js';

const APP = {
  currentPage: 'personlist',
  currentPerson: null,
  cacheRef: null,
  cacheName: 'GiftrPeopleCache',
  sst: [],
  init() {
    //when the page loads
    //- add the event listeners
    //- register the service worker
    //- load any existing data from the cache
    APP.addListeners();
    APP.registerWorker();
    APP.loadData();
    // For a demo of using the <modal-notice> element based on an error...
    // setTimeout(() => {
    //   throw new CacheError('Sample Cache Error', APP.cacheName);
    // }, 3000);
  },
  registerWorker() {
    //if service workers are supported register one
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js');
    }
  },
  addListeners() {
    //add global error event listener
    window.addEventListener('error', APP.handleError);
    //add listeners for nav bar events
    document.getElementById('btnAdd').addEventListener('click', APP.goAdd);
    document.getElementById('btnBack').addEventListener('click', APP.goBack);
    //add listeners for clicking on the person or gift lists
    document.getElementById('personlist').addEventListener('click', APP.handlePersonList);
    document.getElementById('giftlist').addEventListener('click', APP.handleGiftList);
    //add listeners for the person form
    document.getElementById('btnSavePerson').addEventListener('click', APP.savePerson);
    document.getElementById('personform').addEventListener('submit', APP.savePerson);
    document.getElementById('btnDeletePerson').addEventListener('click', APP.deletePerson);
    document.getElementById('btnExport').addEventListener('click', APP.exportPerson);
    //add reset event listeners
    document.getElementById('personform').addEventListener('reset', APP.clearFormErrors);
    document.getElementById('giftform').addEventListener('reset', APP.clearFormErrors);
    //add listeners for the gift form
    document.getElementById('btnSaveIdea').addEventListener('click', APP.saveIdea);
    document.getElementById('giftform').addEventListener('submit', APP.saveIdea);
  },
  loadData() {
    //open the cache, save cacheRef in APP, read all the files' data into sst
    //do this when app first loads
    caches
      .open(APP.cacheName)
      .then((cache) => {
        //save the ref to the person cache
        APP.cacheRef = cache;
        //get and return the list of filenames
        return cache.keys();
      })
      .then((requests) => {
        //fetch all the responses from the person cache based on the filenames
        return Promise.all(requests.map((request) => APP.cacheRef.match(request)));
      })
      .then((responses) => {
        //array of file responses extract the json data from each and return
        return Promise.all(responses.map((response) => response.json()));
      })
      .then((objects) => {
        //save the contents of each file in the single source of truth
        objects.forEach((obj) => APP.sst.push(obj));
        APP.showPeople();
      })
      .catch(APP.displayError);
  },
  goAdd(ev) {
    ev.preventDefault();
    //which form to show based on current page
    switch (APP.currentPage) {
      case 'personlist':
        APP.navigate('addperson');
        break;
      case 'giftlist':
        APP.navigate('addgift');
        break;
      default:
      //do nothing
    }
  },
  goBack(ev) {
    ev.preventDefault();
    //which list to show based on the current page
    switch (APP.currentPage) {
      case 'giftlist':
      case 'addperson':
        APP.navigate('personlist');
        break;
      case 'addgift':
        APP.navigate('giftlist');
        break;
      default:
      //do nothing
    }
  },
  navigate(page) {
    //navigate to new page
    document.body.className = page;
    APP.currentPage = page;
    // console.log('navigate to', page);
    switch (page) {
      case 'personlist':
        //home page - show the list of people from sst, reset current person to null
        APP.currentPerson = null;
        APP.showPeople();
        break;
      case 'addperson':
        //add edit person form has loaded
        let title = document.querySelector('#addperson h2 > span');
        //focus on name field
        document.getElementById('name').focus();
        if (APP.currentPerson == null) {
          title.textContent = 'Add';
          //make sure form is empty
          document.getElementById('personform').reset();
          //hide delete and export buttons
          document.getElementById('btnExport').classList.add('hidden');
          document.getElementById('btnDeletePerson').classList.add('hidden');
          //nothing to add to the form
        } else {
          title.textContent = 'Edit';
          //show the delete and export buttons
          document.getElementById('btnExport').classList.remove('hidden');
          document.getElementById('btnDeletePerson').classList.remove('hidden');
          //edit - populate the form
          let person = APP.sst.find((p) => p.id === APP.currentPerson);
          //use the timestamp from the person.dob to create a date object
          let d = new Date(person.dob);
          //extract the date part from the ISOString version
          let timeStr = d.toISOString().split('T')[0];
          //display the extracted date string
          document.getElementById('dob').value = timeStr;
          document.getElementById('name').value = person.name;
        }
        break;
      case 'giftlist':
        //fetch the list of gifts for the currentPerson
        APP.showGifts();
        break;
      case 'addgift':
        //add a new gift. no need to populate the form
        //make sure form is empty
        document.getElementById('giftform').reset();
        //focus on idea name field
        document.getElementById('idea').focus();
        break;
    }
  },
  handleGiftList(ev) {
    ev.preventDefault();
    //user has clicked somewhere in the gift list
    let target = ev.target;
    let li = target.closest('.gift');
    if (li) {
      //they clicked within a list item
      let btn = target.closest('button');
      if (btn.classList.contains('btnDelete')) {
        //they clicked on a delete button
        let id = li.getAttribute('data-ref');
        if (confirm('The DELETE is permanent. Continue?')) {
          //BEST PRACTICE - would be to build our own HTML based confirmation modal.
          APP.deleteIdea(id);
        }
      }
    }
  },
  handlePersonList(ev) {
    ev.preventDefault();
    let target = ev.target;
    let li = target.closest('.person');
    if (li) {
      //clicked somewhere inside a li.person
      let btn = target.closest('button');
      //set the APP.currentPerson id to be used on the edit and gifts screens
      APP.currentPerson = li.getAttribute('data-ref');
      if (btn && btn.classList.contains('btnEdit')) {
        //user clicked on an edit button
        APP.navigate('addperson');
      }
      if (btn && btn.classList.contains('btnGifts')) {
        //user has clicked on a Gift list button
        APP.navigate('giftlist');
      }
    }
  },
  showGifts() {
    //read the list of gifts from the single source of truth and create the list
    //find the person based on the APP.currentPerson (id)
    let person = APP.sst.find((prsn) => prsn.id == APP.currentPerson);
    //if no matching person, return to the person list screen
    if (!person) APP.navigate('personlist');
    let section = document.getElementById('giftlist');
    if (person.gifts.length === 0) {
      //if no gifts, display a message about that
      section.innerHTML = `<h2>No Ideas for ${person.name} Yet</h2><p>Click the add button in the top bar to add an idea.</p>`;
    } else {
      //display the name of the currentPerson
      section.innerHTML = `<h2>Ideas for ${person.name}</h2><ul class="gifts"></ul>`;
      let ul = section.querySelector('ul');
      //display all the gifts
      ul.innerHTML = person.gifts
        .map((gift) => {
          return `<li class="gift" data-ref="${gift.id}">
          <p class="gift__name">${gift.txt}</p>
          <p class="gift__store">${gift.store}</p>
          <p class="gift__url"><a href="">${gift.url}</a></p>
          <p class="gift__actions">
            <button class="btnDelete"><i class="material-symbols-outlined">delete</i></button>
          </p>
        </li>`;
        })
        .join('');
      //reveal the list one item at a time
      APP.revealItems('.gift');
    }
  },
  showPeople() {
    let section = document.getElementById('personlist');
    if (APP.sst.length === 0) {
      //if there are no people in the SST then show a message
      section.innerHTML = `<h2>Currently no people saved</h2><p>Click the add button in the top bar to add a person.</p>`;
    } else {
      //show the people from the SST
      section.innerHTML = `<ul class="people"></ul>`;
      let ul = section.querySelector('ul');
      let options = {
        month: 'long',
        day: 'numeric',
      };
      ul.innerHTML = APP.sst
        .sort((a, b) => {
          //sort the array of people by DOB month, then day
          let dateA = new Date(a.dob);
          let dateB = new Date(b.dob);
          if (dateA.getMonth() > dateB.getMonth()) {
            return 1;
          } else if (dateB.getMonth() > dateA.getMonth()) {
            return -1;
          } else {
            return dateA.getDate() - dateB.getDate();
          }
        })
        .map(({ id, name, dob }) => {
          //format the date to show just the month and day
          let d = new Date(dob);
          let timeStr = new Intl.DateTimeFormat('en-CA', options).format(d);
          let today = new Date();
          let dateClass = 'past';
          if (d.getMonth() >= today.getMonth() && d.getDate() >= today.getDate()) {
            dateClass = 'future';
          }
          //build the HTML for each li
          return `<li class="person ${dateClass}" data-ref="${id}">
          <p class="person__name">${name}</p>
          <p class="person__dob"><time>${timeStr}</time></p>
          <p class="person__actions">
            <button class="btnEdit"><i class="material-symbols-outlined">edit</i></button>
            <button class="btnGifts"><i class="material-symbols-outlined">redeem</i></button>
          </p>
        </li>`;
        })
        .join('');
      section.append(ul);
      //style the next closest item to today
      section.querySelectorAll('li.future')[0].classList.add('nextup');
      //reveal the list one item at a time
      APP.revealItems('.person');
    }
  },
  async revealItems(selector) {
    //set a delay for revealing a series of child elements
    //so they appear staggered within the totalTime 800ms
    let items = document.querySelectorAll(selector);
    let totalTime = 800; //0.8 seconds to show the whole list
    let timmy = totalTime / items.length;
    for await (let item of items) {
      await APP.delay(timmy);
      item.classList.add('revealed');
    }
  },
  savePerson(ev) {
    ev.preventDefault();
    //save a new person OR the edited value of a person
    let form = document.getElementById('personform');
    APP.clearFormErrors(form);
    if (!form.elements['name'].value) {
      //throw a custom error to be handled by the global error handler if the name is empty
      throw new EmptyInputError('Missing name', form.elements['name']);
    }
    if (!form.elements['dob'].value) {
      //throw a custom error to be handled by the global error handler if the dob is empty
      throw new EmptyInputError('Missing date', form.elements['dob']);
    }
    let person;
    if (APP.currentPerson == null) {
      //adding a new person, create a person template
      person = {
        id: crypto.randomUUID(),
        name: '',
        dob: '',
        gifts: [],
      };
    } else {
      //edit a person
      person = APP.sst.find((prsn) => prsn.id === APP.currentPerson);
    }
    person.name = form.elements['name'].value;
    //take the date from the input, add a time, and adjust for the timezone
    const dob = new Date(form.elements['dob'].value); //might be wrong depending on time of day
    person.dob = new Date(dob.getTime() - dob.getTimezoneOffset() * -60000);
    // console.log(person.dob);
    //use the id plus a custom file extension ".gftr" as the filename
    let filename = `${person.id}.gftr`;
    //create the file
    let file = new File([JSON.stringify(person)], filename, { type: 'application/json' });
    //create a request object
    let request = new Request(filename);
    //create a response object containing the file
    let response = new Response(file, { status: 200, statusText: 'OK', headers: { 'content-type': 'application/json' } });
    APP.cacheRef
      .put(request, response)
      .then(() => {
        // person has been added to the cache
        if (APP.currentPerson === null) {
          // if the person is new, push into the sst array
          APP.sst.push(person);
        } else {
          // if editing, then update the sst array with map( )
          APP.sst = APP.sst.map((p) => {
            if (p.id == APP.currentPerson) return person;
            return p;
          });
        }
        // reset the form and navigate back to the person list
        form.reset();
        APP.navigate('personlist');
      })
      .catch(APP.displayError);
  },
  deletePerson(ev) {
    ev.preventDefault();
    //do a confirmation for the delete
    //best practice would be to replace this with an HTML modal
    if (confirm('Are you sure? This is permanent.')) {
      let filename = `${APP.currentPerson}.gftr`;
      let request = new Request(filename);
      APP.cacheRef
        .delete(request)
        .then(() => {
          //update the sst after a successful delete
          APP.sst = APP.sst.filter((person) => person.id !== APP.currentPerson);
          //reset the form
          let form = document.getElementById('personform');
          form.reset();
          //then back to personlist
          APP.navigate('personlist');
        })
        .catch(APP.displayError);
    }
  },
  exportPerson(ev) {
    ev.preventDefault();
    //find the person in the sst array
    let person = APP.sst.find((prsn) => prsn.id === APP.currentPerson);
    //use the person id to create the filename
    let filename = `${person.name}.gftr`;
    let file = new File([JSON.stringify(person)], filename, { type: 'application/json' });
    //create an anchor tag in memory
    let a = document.createElement('a');
    //turn the file pointer into a url
    a.href = URL.createObjectURL(file);
    //set the filename as the download attribute value
    a.download = filename;
    //simulate the user clicking on the anchor
    a.click();
  },
  saveIdea(ev) {
    ev.preventDefault();
    //save the gift object in the current person in the cache and then in the APP.sst,
    // then reset, then back to giftlist
    let form = document.getElementById('giftform');
    APP.clearFormErrors(form);
    if (!form.elements['idea'].value) {
      //custom error handled by the global error event
      throw new EmptyInputError('Missing Idea', form.elements['idea']);
    }
    if (!form.elements['store'].value) {
      //custom error handled by the global error event
      throw new EmptyInputError('Missing Location', form.elements['store']);
    }
    //find the person in the SST to update
    let person = APP.sst.find((prsn) => prsn.id === APP.currentPerson);
    let url = form.elements['url'].value.trim();
    if (url) {
      if (!url.startsWith('http')) {
        //prepend url with 'https://' if it has a value
        //We could also do testing for valid URL strings...
        url = 'https://'.concat(url);
      }
    }
    //create the new gift object to add to person object
    let gift = {
      id: crypto.randomUUID(),
      txt: form.elements['idea'].value,
      store: form.elements['store'].value,
      url: url,
    };
    person.gifts.push(gift);
    let filename = `${person.id}.gftr`;
    let file = new File([JSON.stringify(person)], filename, { type: 'application/json' });
    let request = new Request(filename);
    let response = new Response(file, { status: 200, statusText: 'OK', headers: { 'content-type': 'application/json' } });
    APP.cacheRef
      .put(request, response)
      .then(() => {
        //after saving the update in the cache make sure the sst array is up to date
        APP.sst = APP.sst.map((p) => {
          if (p.id === APP.currentPerson) return person;
          return p;
        });
        //reset the form and return to the giftlist
        form.reset();
        APP.navigate('giftlist');
      })
      .catch(APP.displayError);
  },
  deleteIdea(id) {
    //delete from the person, then update the cache, then update sst, then redraw gift list
    // find the person who needs the gift removed remove
    let person = APP.sst.find((prsn) => prsn.id === APP.currentPerson);
    //remove the gift from the person.gifts array
    person.gifts = person.gifts.filter((gft) => gft.id !== id);
    let filename = `${person.id}.gftr`;
    let file = new File([JSON.stringify(person)], filename, { type: 'application/json' });
    let request = new Request(filename);
    let response = new Response(file, { status: 200, statusText: 'OK', headers: { 'content-type': 'application/json' } });
    APP.cacheRef
      .put(request, response)
      .then(() => {
        //after overwriting the file in the cache navigate back to gift list
        APP.navigate('giftlist');
      })
      .catch(APP.displayError);
  },
  delay(timmy = 1000) {
    //generic delay function that can be used anywhere
    return new Promise((resolve) => {
      setTimeout(resolve, timmy);
    });
  },
  displayError(err) {
    // use a <modal-notice> web component to display the error
    let modal = document.createElement('modal-notice');
    modal.type = 'error'; //styling can be error, info, or success
    modal.delay = 2000; //millisecond delay until self removal
    modal.innerHTML = `<p slot="message">${err.message}</p>`;
    document.body.append(modal);
    modal.addEventListener('click', (ev) => {
      ev.stopPropagation();
      modal.remove(ev);
    });
  },
  handleError(ev) {
    //handle thrown errors through this global window error event listener
    // console.warn(ev);
    //stops the error appearing in the console
    ev.preventDefault();
    let err = ev.error;
    switch (err.name) {
      case 'NetworkError':
        APP.displayError(err);
        break;
      case 'EmptyInputError':
        //add the data-error message to the label
        err.input.previousElementSibling.setAttribute('data-error', err.message);
        break;
      case 'CacheError':
        APP.displayError(err);
        break;
      default:
        //generic Error
        APP.displayError(err);
    }
  },
  clearFormErrors(ev) {
    //clear out data-err values in a form
    let form;
    if (ev instanceof Event) {
      form = ev.target;
    } else {
      form = ev;
    }
    form.querySelectorAll('label[data-error]').forEach((label) => {
      label.removeAttribute('data-error');
    });
  },
};

document.addEventListener('DOMContentLoaded', APP.init);
