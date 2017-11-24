'use strict';

exports.isStar = true;
exports.runParallel = runParallel;

/** Функция паралелльно запускает указанное число промисов
 * @param {Array} jobs – функции, которые возвращают промисы
 * @param {Number} parallelNum - число одновременно исполняющихся промисов
 * @param {Number} timeout - таймаут работы промиса
 */
function runParallel(jobs, parallelNum, timeout = 1000) {
    // асинхронная магия
    const asyncRun = new AsyncRun(jobs, parallelNum, timeout);

    return new Promise(resolve => {
        asyncRun.start(resolve);
    })
}

function AsyncRun(jobs, parallelNum, timeout) {
    this._jobs = jobs;
    this._parallelNum = parallelNum;
    this._timeout = timeout;
    this._answer = [];
    this._requestCounter = 0;
}

AsyncRun.prototype.start = function (resolve) {
    Promise.all(this._formParallel())
        .then(() => {
            resolve(this._answer
                .sort((a, b) => a.number - b.number)
                .map(response => response.data)
            )
        });
};

AsyncRun.prototype._formParallel = function () {
    let request = [];
    for (let i = 0; i < this._parallelNum; i++) {
        request.push(this._startChain());
    }

    return request;
}

AsyncRun.prototype._formRequest = function (num, resolve) {
    const number = num;

    if (this._jobs.length === 0) {
        resolve('Succes');
    }

    const timeoutId = setTimeout((resolve) => {
        this._addResponse(number, new Error('Respone timeout'));
        this._nextRequest(resolve);
    }, this._timeout);

    this._jobs.shift()().then(
        result => {
            clearInterval(timeoutId);
            this._addResponse(number, result);
            this._nextRequest(resolve);
        },
        error => {
            clearInterval(timeoutId);
            this._addResponse(number, error);
            this._nextRequest(resolve);
        }
    );
}

AsyncRun.prototype._startChain = function () {
    return new Promise(resolve => {
        this._nextRequest(resolve);
    });
}

AsyncRun.prototype._nextRequest = function (resolve) {
    this._requestCounter++;
    this._formRequest(this._requestCounter, resolve)
}

AsyncRun.prototype._addResponse = function (number, data) {
    this._answer.push({
        number,
        data
    });
}