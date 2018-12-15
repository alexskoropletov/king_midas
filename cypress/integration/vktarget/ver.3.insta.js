// TODO:
// - go to instagram
// - read for tasks
// - do them
// - mark as resolved
// - wait
// - repeat

const moment = require('moment');
const config = require('config');

const does = {
  photo: (key, href) => {
    return does
      ._pre(href)
      .then(() => cy.get('.coreSpriteHeartOpen').click())
      .then(() => does._post(key));
  },
  account: (key, href) => {
    return does
      ._pre(href)
      .then(() => cy.contains('Follow').click())
      .then(() => does._post(key));
  },
  _pre: (href) => {
    return cy
      .visit(href)
      .then(() => cy.wait(2000));
  },
  _post: (key) => {
    return cy
      .wait(2000)
      .then(() => {
        const updates = {};
        updates['/tasks/instagram/' + key + '/checked'] = true;
        updates['/tasks/instagram/' + key + '/checked_at'] = moment().format('YYYY-MM-DD HH:mm:ss');
        window.fbDB.ref().update(updates);
        return true;
      });
  }
};

let tasks = {};
let body;

describe('VKTarget Instagram Tasks', function() {
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

  it('should visit Instagram, authorize and do the tasks', () => {
    let dialog = 0;
    for (let i = 0; i < 5000; i++) {
      cy.visit('https://www.instagram.com/accounts/login/?source=auth_switcher');
      cy.wait(2000);
      cy.get('body')
        .then(($body) => {
          body = $body;
          return body.find('input[name=username]').length;
        })
        .then((length) => {
          if (length) {
            cy.get('input[name=username]')
              .type(config.accounts.instagram.login, {delay: Math.random() * 200})
              .should('have.value', config.accounts.instagram.login);
            cy.wait(Math.random() * 1000);
            cy.get('input[name=password]')
              .type(config.accounts.instagram.password, {delay: Math.random() * 200})
              .should('have.value', config.accounts.instagram.password);
            cy.wait(Math.random() * 1000);
            cy.get('form').submit();
          }
        })
        .then(() => {
          // TODO make sure it's logged in
          cy.url().should('include', '/');
          cy.wait(Math.random() * 3000);
          dialog = body.find('div[role=dialog]').length;
          if (dialog) {
            cy.contains('Not Now').click();
          }
          return cy.wait(Math.random() * 3000);
        })
        .then(() => {
          window
            .fbDB
            .ref('tasks/instagram/')
            .orderByChild('checked')
            .equalTo(false)
            .on('child_added', (item) => {
              const itemData = item.val();
              tasks[item.key] = item.val();
            });
          return cy.wait(Math.random() * 1000 + 2000);
        })
        .then(() => {
          if (Object.keys(tasks).length) {
            return Promise.all(Object.keys(tasks).forEach((key) => {
              cy
                .wait(3000)
                .then(() => does[tasks[key].type](key, tasks[key].href));
            }))
              .then(() => {
                tasks = {};
              })
              .catch(console.log);
          }
        })
        .then(() => cy.wait(3000))
        .end();
    }
  });
});
