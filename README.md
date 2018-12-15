# King Midas
## Powered by [Cypress](https://www.cypress.io/)

This is a bot script for vktarget.ru. It should pretend to be a real user that goes to vktarget, waits for the tasks,
saves those tasks to Firebase and waits. At the same time, another part of this script should pretend to be a vk and
Instagram users. This two scripts wait for new tasks in Firebase, do them and mark them as checked. At the same time,
 the first script is waiting for checked but not verified tasks to appear in Firebase. As soon as one of
scripts marks a task as checked, it will try to press the button "the task is ready" and receive payment.

I've ran into a bug that I cant handle for a lot of time; the first script, watcher.js crashes after first task
verification, with an error that I cant track down, I can't figure out what's going on, because the error message
is pretty useless: can't find 1 in undefined. And no reasonable back tracking. So I'll just leave it here.

Maybe I'll try to automate another projects:

- SMMOK
- SMMOK-fb
- smmok-yt
- VkSerfing
- Forumok (Форумок)
- VPRKA
- v-like
- socialtools
- sarafanka
- seosprint
- prospero
- cashbox
- likesrock
- bosslike
- BestLiker
- qcomment
