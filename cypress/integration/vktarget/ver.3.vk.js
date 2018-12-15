// TODO:
// - go to vk
// - get tasks
// - do them
// - mark them as resolved
// - wait
// - repeat


const moment = require('moment');
const config = require('config');

const does = {
  club: (key, href) => {
    return does
      ._pre(href)
      .then(() => cy.get('.page_action_left.fl_l'))
      .then(($body) => {
        return $body.find('button').length;
      })
      .then((length) => {
        if (length) {
          return cy.get('.page_action_left.fl_l').find('button').click();
        }
      })
      .then(() => does._post(key));
  },
  page: (key, href) => {
    return does
      ._pre(href)
      .then(() => cy.get('body'))
      .then((body) => body.find('.post_content').length)
      .then((length) => {
        if (length) {
          return cy.get('.post_content')
            .find('.post_info')
            .find('.like_wrap')
            .find('.like_btns')
            .find('a.like_btn.like._like')
            .eq(0)
            .click();
        }
      })
      .then(() => does._post(key));
  },
  share: (key, href) => {
    return does
      ._pre(href)
      .then(() => cy.get('.post_content')
        .find('.post_info')
        .find('.like_wrap')
        .find('.like_btns')
        .find('a.like_btn.share._share')
        .eq(0)
        .click())
      .then(() => does._post(key));
  },
  friend: (key, href) => {
    return does
      ._pre(href)
      .then(() => cy.get('#friend_status')
        .find('.profile_action_btn')
        .find('.flat_button.button_wide')
        .eq(0)
        .click())
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
        updates['/tasks/vk/' + key + '/checked'] = true;
        updates['/tasks/vk/' + key + '/checked_at'] = moment().format('YYYY-MM-DD HH:mm:ss');
        window.fbDB.ref().update(updates);
        return true;
      });
  }
};

let tasks = {};
let body;

describe('VKTarget VK Tasks', function() {
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

  it('should visit VK, authorize and do the tasks', () => {
    // for (let i = 0; i < 5000; i++) {
      cy.visit('https://vk.com');
      cy.wait(2000);
      cy.get('body')
        .then(($body) => {
          body = $body;
          return $body.find('#index_email').length;
        })
        .then((length) => {
          if (length) {
            authoriseInVK();
          }
        })
        .then(() => {
          cy.url().should('include', '/feed');
          return cy.wait(Math.random() * 3000);
        })
        .then(() => {
          window
            .fbDB
            .ref('tasks/vk/')
            .orderByChild('checked')
            .equalTo(false)
            .on('child_added', (item) => {
              const itemData = item.val();
              if (moment().isSameOrBefore(moment(itemData.added).add(10, 'minutes'))) {
                tasks[item.key] = item.val();
              } else {
                const updates = {};
                updates['/tasks/vk/' + item.key + '/checked'] = true;
                updates['/tasks/vk/' + item.key + '/resolved'] = true;
                updates['/tasks/vk/' + item.key + '/missed'] = true;
                updates['/tasks/vk/' + item.key + '/missed_at'] = moment().format('YYYY-MM-DD HH:mm:ss');
                window.fbDB.ref().update(updates);
              }
            });
          return cy.wait(Math.random() * 1000 + 2000);
        })
        .then(() => {
          Object.keys(tasks).forEach((key) => {
            console.log('[!]', tasks[key].type, key, tasks[key].href);
            cy.wait(3000);
            does[tasks[key].type](key, tasks[key].href);
          });
          tasks = {};
          return cy.wait(3000);
        })
        .end();
    // }
  });
});

function authoriseInVK() {
  cy.get('#index_email')
    .type(config.accounts.vk.login, {force: true, delay: Math.random() * 200})
    .should('have.value', config.accounts.vk.login);
  cy.wait(Math.random() * 1000);
  cy.get('#index_pass')
    .type(config.accounts.vk.password, {force: true, delay: Math.random() * 200})
    .should('have.value', config.accounts.vk.password);
  cy.wait(Math.random() * 1000);
  cy.get('#index_login_button')
    .click({force: true});
}
