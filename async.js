'use strict';

exports.isStar = true;
exports.runParallel = runParallel;

/** Функция паралелльно запускает указанное число промисов
 * @param {Array} jobs – функции, которые возвращают промисы
 * @param {Number} parallelNum - число одновременно исполняющихся промисов
 * @param {Number} timeout - таймаут работы промиса
 * @returns {Promise}
 */
function runParallel(jobs, parallelNum, timeout = 1000) {
    // асинхронная магия
    const asyncRun = new AsyncRun(jobs, parallelNum, timeout);

    return asyncRun.start();
}

function AsyncRun(jobs, parallelNum, timeout) {
    this._jobs = jobs;
    this._parallelNum = parallelNum;
    this._timeout = timeout;
    this._answer = [];
    this._requestCounter = 0;
}

AsyncRun.prototype.start = function () {
    return Promise.all(this._formParallel())
        .then(() => this._answer);
};

AsyncRun.prototype._formParallel = function () {
    const requests = [];
    for (let i = 0; i < this._parallelNum; i++) {
        requests.push(this._nextRequest());
    }

    return requests;
};

AsyncRun.prototype._nextRequest = function () {
    if (this._jobs.length === this._requestCounter) {
        return Promise.resolve();
    }
    const index = this._requestCounter++;

    return this._formRequest(index)
        .then((result) => {
            this._answer[index] = result;

            return this._nextRequest();
        });
};

AsyncRun.prototype._formRequest = function (index) {
    return new Promise (resolve => {
        setTimeout(() => {
            resolve(new Error('Promise timeout'));
        }, this._timeout);
        this._jobs[index]().then(resolve, resolve);
    });
};
