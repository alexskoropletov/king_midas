// TODO:
// - get list of tasks on page
// - get list of solved but not checked tasks from DB
// - try to click, mark as checked, save result to DB
// - add new tasks to DB: social network, link, type, price
// - wait for 1 minute
// - repeat

const moment = require('moment');
const config = require('config');

describe('VKTarget tasks watcher', function() {
  beforeEach(() => {
    Cypress.Cookies.debug(false);
    Cypress.Cookies.defaults({
      whitelist: /(.*)/
    });

    Cypress.on('uncaught:exception', (err, runnable) => {
      // returning false here prevents Cypress from
      // failing the test
      return false;
    });
  });

  it('should visit VKTarget and collect task list', () => {
    // for (let i = 0; i < 7200; i++) {
      cy.visit(config.target);
      cy.wait(3000);
      cy.get('body')
        .then((body) => {
          return body.find('.vkt-promo').find('.vkt-menu__item.login').length;
        })
        .then((length) => {
          if (length) {
            authToVKTraget();
            cy.wait(Math.random() * 2000 + 3000);
          }
        })
        .then(() => {
          return goToVkTargetList();
        })
        .then(() => checkTasks())
        .then(() => {
          console.log('[!] ' + 4);
          return cy.wait(3000);
        })
        .then(() => addTasks())
        .then(() => {
          console.log('[!] ' + 6);
          return cy.wait(Math.random() * 3 * 60 * 1000 + 1000);
        }) // waiting for three minutes
        .end();
    // }
  });
});

function authToVKTraget() {
  cy.get('.vkt-promo')
    .find('input[name=username]')
    .first()
    .type(config.accounts.target.login, {force: true, delay: Math.random() * 200})
    .should('have.value', config.accounts.target.login);
  cy.wait(Math.random() * 1000);
  cy.get('.vkt-promo')
    .find('input[name=password]')
    .first()
    .type(config.accounts.target.password, {force: true, delay: Math.random() * 200})
    .should('have.value', config.accounts.target.password);
  cy.wait(Math.random() * 1000);
  cy.get('.vkt-promo')
    .find('.vkt-menu__item.login')
    .first()
    .click({force: true});
}

function goToVkTargetList() {
  return cy
    .wait(Math.random() * 1000)
    .then(() => {
      cy.get('.vkt-head')
        .find('.vkt-menu')
        .find('a')
        .should('have.length', 2);
      cy.contains('Заработать')
        .as('taskListLink')
        .should('have.length', 1);
      cy.get('@taskListLink').click({force: true});
      return cy.wait(Math.random() * 2000 + 2000);
    })
    .then(() => {
      cy.url().should('include', '/list/');
      return cy.wait(Math.random() * 2000);
    });
}

function getType(taskName) {
  let type;
  // Instagram
  if (taskName === 'аккаунт') { // Подписаться на аккаунт +
    type = 'account';
  }
  if (taskName === 'на фото') { // Поставьте лайк на фото +
    type = 'photo';
  }
  // VK
  if (taskName === 'сообщество') { // Вступите в сообщество +
    type = 'club';
  }
  if (taskName === 'странице') { // Поставьте лайк на странице +
    type = 'page';
  }
  if (taskName === 'рассказать друзьям') { // Нажмите рассказать друзьям
    type = 'share';
  }
  if (taskName === 'поделиться записью') { // Нажмите рассказать друзьям // https://vk.com/wall-119783853_1759
    type = 'share';
  }
  if (taskName === 'друзья') { // Добавить в друзья // https://vk.com/id512189532
    type = 'friend';
  }

  return type;
}

function addTasks() {
  console.log('[!] ' + 5);
  return cy
    .get('.vkt-content__list-item')
    .each(($el) => {
      if (!$el.hasClass('hide')) {
        const itemId = $el.data('item_id');
        const price = $el.find('.vkt-popup__task-details-arrow.left').find('span').text();
        const platform = $el.find('.fa').attr('class').split('fa fa-').join('');
        const href = $el
          .find('a')
          .eq(1)
          .attr('href');
        const taskId = hash(href + price + platform).toString().split('-').join('');
        const type = getType($el.find('a').eq(1).text());
        window.fbDB.ref('tasks/' + platform).once('value')
          .then(function(snapshot) {
            if (
              !snapshot.hasChild(taskId)
              && platform
              && type
              && href
            ) {
              window.fbDB.ref('tasks/' + platform + '/' + taskId).set({
                itemId,
                platform,
                type,
                href,
                price,
                added: moment().format('YYYY-MM-DD HH:mm:ss'),
                checked: false,
                resolved: false
              });
            }
          });
      }
    });
}

function findAndResolve(taskId, itemId, platform) {
  console.log('[!] ' + 2 + ' -> ' + itemId + ' -> ' + taskId + ' -> ' + platform);
  return cy.get('body')
    .then(($body) => $body.find('div[data-item_id=' + itemId + ']').length)
    .then((length) => {
      if (length) {
        cy
          .get('div[data-item_id=' + itemId + ']')
          .find('div[data-bind=check].vkt-content__list-item-check.right')
          .click({ force: true });
      }
      cy.wait(500);
    })
    .then(() => {
      const updates = {};
      updates['/tasks/' + platform + '/' + taskId + '/resolved'] = true;
      updates['/tasks/' + platform + '/' + taskId + '/resolved_at'] = moment().format('YYYY-MM-DD HH:mm:ss');
      window.fbDB.ref().update(updates);
    })
    .then(() => cy.wait(Math.random() * 1000 + 500));
}


function checkTasks() {
  console.log('[!] ' + 1);
  let tasks = {};
  return cy
    .wait(3000)
    .then(() => {
      window
        .fbDB
        .ref('tasks/instagram')
        .orderByChild('resolved')
        .equalTo(false)
        .on('child_added', (item) => {
          const itemData = item.val();
          if (itemData.checked === true) {
            tasks[item.key] = item.val();
          }
        });
      return cy.wait(2000);
    })
    .then(() => {
      window
        .fbDB
        .ref('tasks/vk')
        .orderByChild('resolved')
        .equalTo(false)
        .on('child_added', (item) => {
          const itemData = item.val();
          if (itemData.checked === true) {
            tasks[item.key] = item.val();
          }
        });
      return cy.wait(2000);
    })
    .then(() => {
      Object.keys(tasks).forEach((key) => {
        cy
          .wait(Math.random() * 1000 + 1000)
          .then(() => findAndResolve(key, tasks[key].itemId, tasks[key].platform))
          .then(() => cy.wait(Math.random() * 1000 + 1000));
      });
      tasks = {};
    })
    .then(() => {
      console.log('[!] ' + 3);
      return cy.wait(1234)
    });
}

function hash(text) {
  let hash = 0, i, chr;
  if (text.length === 0) return hash;
  for (i = 0; i < text.length; i++) {
    chr   = text.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash;
}

function taskIterator(tasks) {
  let nextIndex = 0;

  return {
    next: () => nextIndex < tasks.length ? { value: tasks[nextIndex++], done: false } : { done: true }
  }
}
/**
 TODO: fix this
 cypress_runner.js:161480 TypeError: Cannot read property '1' of undefined
 at parseCheckTaskResponse (https://vktarget.ru/js/list.js?v=25671df6ff4e681464f6da81be2c06e381d318e5:330:15)
 at Object.success (https://vktarget.ru/js/list.js?v=25671df6ff4e681464f6da81be2c06e381d318e5:498:4)
 at c (https://vktarget.ru/js/vendor/jquery-1.11.3.min.js:4:26036)
 at Object.fireWith [as resolveWith] (https://vktarget.ru/js/vendor/jquery-1.11.3.min.js:4:26840)
 at k (https://vktarget.ru/js/vendor/jquery-1.11.3.min.js:6:14258)
 at XMLHttpRequest.r (https://vktarget.ru/js/vendor/jquery-1.11.3.min.js:6:18646)
 From previous event:
 at run (https://vktarget.ru/__cypress/runner/cypress_runner.js:59449:15)
 at Object.cy.(anonymous function) [as visit] (https://vktarget.ru/__cypress/runner/cypress_runner.js:59676:11)
 at Context.runnable.fn (https://vktarget.ru/__cypress/runner/cypress_runner.js:59806:20)
 at callFn (https://vktarget.ru/__cypress/runner/cypress_runner.js:28583:21)
 at Test.Runnable.run (https://vktarget.ru/__cypress/runner/cypress_runner.js:28576:7)
 at https://vktarget.ru/__cypress/runner/cypress_runner.js:62726:28
 From previous event:
 at Object.onRunnableRun (https://vktarget.ru/__cypress/runner/cypress_runner.js:62721:20)
 at $Cypress.action (https://vktarget.ru/__cypress/runner/cypress_runner.js:58108:51)
 at Test.Runnable.run (https://vktarget.ru/__cypress/runner/cypress_runner.js:61787:20)
 at Runner.runTest (https://vktarget.ru/__cypress/runner/cypress_runner.js:29046:10)
 at https://vktarget.ru/__cypress/runner/cypress_runner.js:29152:12
 at next (https://vktarget.ru/__cypress/runner/cypress_runner.js:28966:14)
 at https://vktarget.ru/__cypress/runner/cypress_runner.js:28976:7
 at next (https://vktarget.ru/__cypress/runner/cypress_runner.js:28908:14)
 at https://vktarget.ru/__cypress/runner/cypress_runner.js:28939:7
 at next (https://vktarget.ru/__cypress/runner/cypress_runner.js:62691:16)
 at https://vktarget.ru/__cypress/runner/cypress_runner.js:62703:11
 From previous event:
 at onNext (https://vktarget.ru/__cypress/runner/cypress_runner.js:62702:57)
 at done (https://vktarget.ru/__cypress/runner/cypress_runner.js:28544:5)
 at callFn (https://vktarget.ru/__cypress/runner/cypress_runner.js:28601:7)
 at Hook.Runnable.run (https://vktarget.ru/__cypress/runner/cypress_runner.js:28576:7)
 at https://vktarget.ru/__cypress/runner/cypress_runner.js:62726:28
 From previous event:
 at Object.onRunnableRun (https://vktarget.ru/__cypress/runner/cypress_runner.js:62721:20)
 at $Cypress.action (https://vktarget.ru/__cypress/runner/cypress_runner.js:58108:51)
 at Hook.Runnable.run (https://vktarget.ru/__cypress/runner/cypress_runner.js:61787:20)
 at next (https://vktarget.ru/__cypress/runner/cypress_runner.js:28922:10)
 at https://vktarget.ru/__cypress/runner/cypress_runner.js:28944:5
 at timeslice (https://vktarget.ru/__cypress/runner/cypress_runner.js:24185:27)
*/

