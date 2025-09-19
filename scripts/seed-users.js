'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === 'function' ? Iterator : Object).prototype
      );
    return (
      (g.next = verb(0)),
      (g['throw'] = verb(1)),
      (g['return'] = verb(2)),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                    ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = seedUsers;
// prettier-ignore
require("tsconfig-paths/register");
var seed_users_1 = require('../data/seed-users');
var db_1 = require('../lib/db');
var backend_1 = require('@clerk/backend'); // Import createClerkClient
var logger_1 = require('../lib/logger');
var logger = (0, logger_1.createLogger)('seed-users');
function seedUsers() {
  return __awaiter(this, void 0, void 0, function () {
    var clerkClient_1,
      existingUsers,
      deletionPromises,
      people,
      _i,
      _a,
      _b,
      index,
      user,
      userObj,
      firstName,
      lastName,
      username,
      person,
      error_1,
      existingUser,
      userObj,
      existingPerson,
      firstName,
      lastName,
      username,
      person,
      findError_1,
      error_2;
    var _this = this;
    var _c, _d;
    return __generator(this, function (_e) {
      switch (_e.label) {
        case 0:
          _e.trys.push([0, 24, , 25]);
          clerkClient_1 = (0, backend_1.createClerkClient)({
            // Use createClerkClient
            secretKey: process.env.CLERK_SECRET_KEY,
          });
          logger.info('Starting user seeding process...');
          return [4 /*yield*/, clerkClient_1.users.getUserList()];
        case 1:
          existingUsers = _e.sent().data;
          logger.info(
            'Found '.concat(existingUsers.length, ' existing users to clean up')
          );
          deletionPromises = existingUsers.map(function (user) {
            return __awaiter(_this, void 0, void 0, function () {
              var error_3;
              var _a, _b;
              return __generator(this, function (_c) {
                switch (_c.label) {
                  case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [
                      4 /*yield*/,
                      clerkClient_1.users.deleteUser(user.id),
                    ];
                  case 1:
                    _c.sent();
                    logger.debug('Deleted user: '.concat(user.id));
                    return [3 /*break*/, 3];
                  case 2:
                    error_3 = _c.sent();
                    if (
                      ((_b =
                        (_a =
                          error_3 === null || error_3 === void 0
                            ? void 0
                            : error_3.errors) === null || _a === void 0
                          ? void 0
                          : _a[0]) === null || _b === void 0
                        ? void 0
                        : _b.code) === 'resource_not_found' ||
                      (error_3 === null || error_3 === void 0
                        ? void 0
                        : error_3.status) === 404
                    ) {
                      logger.debug('User '.concat(user.id, ' already deleted'));
                    } else {
                      logger.error(
                        'Failed to delete user '.concat(user.id, ':'),
                        error_3
                      );
                    }
                    return [3 /*break*/, 3];
                  case 3:
                    return [2 /*return*/];
                }
              });
            });
          });
          // Wait for all deletions to complete
          return [4 /*yield*/, Promise.allSettled(deletionPromises)];
        case 2:
          // Wait for all deletions to complete
          _e.sent();
          logger.info('User cleanup completed');
          // Clear database
          return [4 /*yield*/, db_1.db.person.deleteMany()];
        case 3:
          // Clear database
          _e.sent();
          logger.info('Database person table cleared');
          // Wait a bit to ensure Clerk has processed the deletions
          return [
            4 /*yield*/,
            new Promise(function (resolve) {
              return setTimeout(resolve, 1000);
            }),
          ];
        case 4:
          // Wait a bit to ensure Clerk has processed the deletions
          _e.sent();
          people = [];
          logger.info(
            'Creating '.concat(seed_users_1.seedUsers.length, ' new users...')
          );
          (_i = 0), (_a = seed_users_1.seedUsers.entries());
          _e.label = 5;
        case 5:
          if (!(_i < _a.length)) return [3 /*break*/, 23];
          (_b = _a[_i]), (index = _b[0]), (user = _b[1]);
          _e.label = 6;
        case 6:
          _e.trys.push([6, 11, , 22]);
          if (!(index > 0)) return [3 /*break*/, 8];
          return [
            4 /*yield*/,
            new Promise(function (resolve) {
              return setTimeout(resolve, 200);
            }),
          ];
        case 7:
          _e.sent();
          _e.label = 8;
        case 8:
          return [
            4 /*yield*/,
            clerkClient_1.users.createUser({
              firstName: user.firstName,
              lastName: user.lastName,
              username: user.username,
              emailAddress: [user.email],
            }),
          ];
        case 9:
          userObj = _e.sent();
          logger.debug(
            'Created Clerk user: '
              .concat(userObj.username, ' (')
              .concat(userObj.id, ')')
          );
          firstName = userObj.firstName || '';
          lastName = userObj.lastName || '';
          username = userObj.username || '';
          return [
            4 /*yield*/,
            db_1.db.person.create({
              data: {
                id: userObj.id,
                firstName: firstName,
                lastName: lastName,
                username: username,
                imageUrl: userObj.imageUrl,
                settings: {
                  create: {},
                },
              },
            }),
          ];
        case 10:
          person = _e.sent();
          logger.debug('Created database person: '.concat(person.username));
          people.push(person);
          return [3 /*break*/, 22];
        case 11:
          error_1 = _e.sent();
          if (
            !(
              ((_d =
                (_c =
                  error_1 === null || error_1 === void 0
                    ? void 0
                    : error_1.errors) === null || _c === void 0
                  ? void 0
                  : _c[0]) === null || _d === void 0
                ? void 0
                : _d.code) === 'form_identifier_exists' ||
              (error_1 === null || error_1 === void 0
                ? void 0
                : error_1.status) === 422
            )
          )
            return [3 /*break*/, 20];
          logger.warn(
            'User '.concat(
              user.username,
              ' already exists, trying to handle gracefully...'
            )
          );
          _e.label = 12;
        case 12:
          _e.trys.push([12, 18, , 19]);
          return [
            4 /*yield*/,
            clerkClient_1.users.getUserList({
              username: [user.username],
            }),
          ];
        case 13:
          existingUser = _e.sent();
          if (!(existingUser.data.length > 0)) return [3 /*break*/, 17];
          userObj = existingUser.data[0];
          logger.debug(
            'Found existing user: '
              .concat(userObj.username, ' (')
              .concat(userObj.id, ')')
          );
          return [
            4 /*yield*/,
            db_1.db.person.findUnique({
              where: { id: userObj.id },
            }),
          ];
        case 14:
          existingPerson = _e.sent();
          if (!!existingPerson) return [3 /*break*/, 16];
          firstName = userObj.firstName || '';
          lastName = userObj.lastName || '';
          username = userObj.username || '';
          return [
            4 /*yield*/,
            db_1.db.person.create({
              data: {
                id: userObj.id,
                firstName: firstName,
                lastName: lastName,
                username: username,
                imageUrl: userObj.imageUrl,
                settings: {
                  create: {},
                },
              },
            }),
          ];
        case 15:
          person = _e.sent();
          people.push(person);
          logger.debug(
            'Added existing user to database: '.concat(person.username)
          );
          return [3 /*break*/, 17];
        case 16:
          people.push(existingPerson);
          logger.debug(
            'User already exists in database: '.concat(existingPerson.username)
          );
          _e.label = 17;
        case 17:
          return [3 /*break*/, 19];
        case 18:
          findError_1 = _e.sent();
          logger.error(
            'Could not find or process existing user '.concat(
              user.username,
              ':'
            ),
            findError_1
          );
          return [3 /*break*/, 19];
        case 19:
          return [3 /*break*/, 21];
        case 20:
          logger.error(
            'Failed to create user '.concat(user.username, ':'),
            error_1
          );
          throw error_1;
        case 21:
          return [3 /*break*/, 22];
        case 22:
          _i++;
          return [3 /*break*/, 5];
        case 23:
          logger.info(
            'Successfully seeded '
              .concat(people.length, ' users out of ')
              .concat(seed_users_1.seedUsers.length, ' expected')
          );
          if (people.length >= seed_users_1.seedUsers.length) {
            logger.info('All users seeded successfully');
            return [2 /*return*/, true];
          } else {
            logger.warn(
              'Some users may not have been seeded, but proceeding...'
            );
            return [2 /*return*/, true];
          }
          return [3 /*break*/, 25];
        case 24:
          error_2 = _e.sent();
          logger.error('Error seeding users:', error_2);
          throw error_2;
        case 25:
          return [2 /*return*/];
      }
    });
  });
}
seedUsers();
