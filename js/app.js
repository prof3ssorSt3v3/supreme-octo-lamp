const APP = {
  currentPage: 'personlist',
  cacheRef: null,
  cacheName: 'giftrpeoplecache',
  sst: [
    {
      id: crypto.randomUUID(),
      name: 'fake name',
      date: Date.now(),
      gifts: [],
    },
  ],
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

    document.getElementById('personlist').addEventListener('click', APP.handleGiftList);

    document.getElementById('btnSaveIdea').addEventListener('click', APP.saveIdea);
    // document.getElementById('btnDeleteIdea').addEventListener('click', APP.deleteIdea);
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
      .catch(console.warn);
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
        //fetch the data from sst currentPerson != null
        if (APP.currentPerson == null) {
          //add
        } else {
          //edit
        }
        break;
      case 'giftlist':
        //fetch the list of gifts for the currentPerson
        APP.showGifts();
        break;
      case 'addgift':
        //
        break;
    }
  },
  handleGiftList(ev) {
    ev.preventDefault();
    let target = ev.target;
    let li = target.closest('.gift');
    if (li) {
      let btn = target.closest('button');
      //TODO:
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
        .map(({ id, name, date }) => {
          let d = new Date(date);
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
  },
  deletePerson(ev) {
    ev.preventDefault();
  },
  exportPerson(ev) {
    ev.preventDefault();
  },
  saveIdea(ev) {
    ev.preventDefault();
  },
  deleteIdea(ev) {
    ev.preventDefault();
  },
};

document.addEventListener('DOMContentLoaded', APP.init);
