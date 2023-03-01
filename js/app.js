const APP = {
  currentPage: 'personlist',
  currentPerson: null,
  cacheRef: null,
  cacheName: 'GiftrPeopleCache',
  sst: [],
  init() {
    APP.addListeners();
    APP.registerWorker();
    APP.loadData();
  },
  registerWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js');
    }
  },
  addListeners() {
    document.getElementById('btnAdd').addEventListener('click', APP.goAdd);
    document.getElementById('btnBack').addEventListener('click', APP.goBack);

    document.getElementById('personlist').addEventListener('click', APP.handlePersonList);

    document.getElementById('btnSavePerson').addEventListener('click', APP.savePerson);
    document.getElementById('btnDeletePerson').addEventListener('click', APP.deletePerson);
    document.getElementById('btnExport').addEventListener('click', APP.exportPerson);

    document.getElementById('giftlist').addEventListener('click', APP.handleGiftList);

    document.getElementById('btnSaveIdea').addEventListener('click', APP.saveIdea);
  },
  loadData() {
    //open the cache, save cacheRef, read all the files into sst
    caches
      .open(APP.cacheName)
      .then((cache) => {
        APP.cacheRef = cache;
        return cache.keys();
      })
      .then((requests) => {
        //fetch all the responses from the
        return Promise.all(requests.map((request) => APP.cacheRef.match(request)));
      })
      .then((responses) => {
        //array of file responses
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
    console.log('navigate to', page);
    switch (page) {
      case 'personlist':
        //home page - show the list of people from sst, reset current person
        APP.currentPerson = null;
        APP.showPeople();
        break;
      case 'addperson':
        //add edit person
        let title = document.querySelector('#addperson h2 > span');
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
          let d = new Date(person.dob);
          let timeStr = d.toISOString().split('T')[0];
          console.log('edit', timeStr);
          document.getElementById('name').value = person.name;
          document.getElementById('dob').value = timeStr;
        }
        break;
      case 'giftlist':
        //fetch the list of gifts for the currentPerson
        APP.showGifts();
        break;
      case 'addgift':
        //add a new gift. no need to populate the form
        break;
    }
  },
  handleGiftList(ev) {
    ev.preventDefault();
    let target = ev.target;
    let li = target.closest('.gift');
    if (li) {
      let btn = target.closest('button');
      if (btn.classList.contains('btnDelete')) {
        let id = li.getAttribute('data-ref');
        const confirm = confirm('The DELETE is permanent. Continue?');
        if (confirm) {
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
      APP.currentPerson = li.getAttribute('data-ref');
      if (btn.classList.contains('btnEdit')) {
        APP.navigate('addperson');
      }
      if (btn.classList.contains('btnGifts')) {
        APP.navigate('giftlist');
      }
    }
  },
  showGifts() {
    let person = APP.sst.find((prsn) => prsn.id == APP.currentPerson);
    if (!person) APP.navigate('personlist');
    let section = document.getElementById('giftlist');
    if (person.gifts.length === 0) {
      section.innerHTML = `<h2>No Gift Ideas Yet</h2><p>Click the add button in the top bar to add an idea.</p>`;
    } else {
      section.innerHTML = `<ul class="gifts"></ul>`;
      let ul = section.querySelector('ul');
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
    }
  },
  showPeople() {
    let section = document.getElementById('personlist');
    if (APP.sst.length === 0) {
      section.innerHTML = `<h2>Currently no people saved</h2><p>Click the add button in the top bar to add a person.</p>`;
    } else {
      section.innerHTML = `<ul class="people"></ul>`;
      let ul = section.querySelector('ul');
      let options = {
        month: 'long',
        day: 'numeric',
      };
      ul.innerHTML = APP.sst
        .sort((a, b) => {
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
          let d = new Date(dob);
          let timeStr = new Intl.DateTimeFormat('en-CA', options).format(d);

          return `<li class="person" data-ref="${id}">
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
    }
  },
  savePerson(ev) {
    ev.preventDefault();
    let form = document.getElementById('personform');
    let person;
    if (APP.currentPerson == null) {
      person = {
        id: crypto.randomUUID(),
        name: '',
        dob: '',
        gifts: [],
      };
    } else {
      person = APP.sst.find((prsn) => prsn.id === APP.currentPerson);
    }
    person.name = form.elements['name'].value;
    person.dob = new Date(form.elements['dob'].value).valueOf();
    let filename = `${person.id}.json`;
    console.log({ filename });
    console.log(person);
    let file = new File([JSON.stringify(person)], filename, { type: 'application/json' });
    let request = new Request(filename);
    let response = new Response(file, { status: 200, statusText: 'OK', headers: { 'content-type': 'application/json' } });
    APP.cacheRef
      .put(request, response)
      .then(() => {
        console.log('cache has been updated', APP.currentPerson);
        if (APP.currentPerson === null) {
          console.log('add person to sst');
          APP.sst.push(person);
        } else {
          console.log('edit person in sst');
          APP.sst = APP.sst.map((p) => {
            if (p.id == APP.currentPerson) return person;
            return p;
          });
        }
        console.log(APP.sst);
        form.reset();
        APP.navigate('personlist');
      })
      .catch(APP.displayError);
  },
  deletePerson(ev) {
    ev.preventDefault();
    let filename = `${APP.currentPerson}.json`;
    let request = new Request(filename);
    APP.cacheRef
      .delete(request)
      .then(() => {
        //update the sst
        APP.sst = APP.sst.filter((person) => person.id !== APP.currentPerson);

        let form = document.getElementById('personform');
        form.reset();
        //then back to personlist
        APP.navigate('personlist');
      })
      .catch(APP.displayError);
  },
  exportPerson(ev) {
    ev.preventDefault();
    let person = APP.sst.find((prsn) => prsn.id === APP.currentPerson);
    let filename = `${person.name}.json`;
    let file = new File([JSON.stringify(person)], filename, { type: 'application/json' });
    let a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = filename;
    a.click();
  },
  saveIdea(ev) {
    ev.preventDefault();
    //save the gift object in the current person in the cache and then in the APP.sst,
    // then reset, then back to giftlist
    let form = document.getElementById('giftform');
    let person = APP.sst.find((prsn) => prsn.id === APP.currentPerson);
    let gift = {
      id: crypto.randomUUID(),
      txt: form.elements['idea'].value,
      store: form.elements['store'].value,
      url: form.elements['url'].value,
    };
    person.gifts.push(gift);
    let filename = `${person.id}.json`;
    let file = new File([JSON.stringify(person)], filename, { type: 'application/json' });
    let request = new Request(filename);
    let response = new Response(file, { status: 200, statusText: 'OK', headers: { 'content-type': 'application/json' } });
    APP.cacheRef
      .put(request, response)
      .then(() => {
        APP.sst = APP.sst.map((p) => {
          if (p.id === APP.currentPerson) return person;
          return p;
        });
        form.reset();
        APP.navigate('giftlist');
      })
      .catch(APP.displayError);
  },
  deleteIdea(id) {
    //delete from the person, then update the cache, then update sst, then redraw gift list
    console.log('delete gift', id);
    let person = APP.sst.find((prsn) => prsn.id === APP.currentPerson);
    person.gifts = person.gifts.filter((gft) => gft.id !== id);
    let filename = `${person.id}.json`;
    let file = new File([JSON.stringify(person)], filename, { type: 'application/json' });
    let request = new Request(filename);
    let response = new Response(file, { status: 200, statusText: 'OK', headers: { 'content-type': 'application/json' } });
    APP.cacheRef
      .put(request, response)
      .then(() => {
        APP.navigate('giftlist');
      })
      .catch(APP.displayError);
  },
  displayError(err) {
    console.warn(err);
    //show error on page TODO:
  },
};

document.addEventListener('DOMContentLoaded', APP.init);
