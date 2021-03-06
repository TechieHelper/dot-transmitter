document.addEventListener("DOMContentLoaded", () => {

    var lines = []
    var trainTimers = []
    var trainIterators = [];
    var currentSelectedStation = null
    var flag = false;
    var paper = Raphael(0, 0, window.innerWidth, window.innerHeight);
    var gameSpeed = 3;
    var totalAvailablePoints = 0;
    var startTime;
    var gold=-1, silver=-1, bronze=-1, fail=-1;
    const spawnTimer = 40; // In 1/100s
    const buttonSizeModifier = 1;

    String.prototype.toMMSS = function () {
        var sec_num = parseInt(this, 10); // don't forget the second param
        var hours   = Math.floor(sec_num / 3600);
        var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        var seconds = sec_num - (hours * 3600) - (minutes * 60);
    
        if (minutes < 10) {minutes = "0"+minutes;}
        if (seconds < 10) {seconds = "0"+seconds;}
        return minutes+':'+seconds;
    }

    function* driveTrain(train) {
        if (parseInt(lines[train][1].textContent) > 0) {
            console.log(`Train ${train} now starting.`)
            let line = lines[train][0];
            lines[train][1].textContent = parseInt(lines[train][1].textContent) - 1;
            if (stripPx(lines[train][1].style.height) != window.innerHeight) {
                lines[train][1].style.height = 30 + parseInt(lines[train][1].textContent) * buttonSizeModifier + "px";
                lines[train][1].style.width = 30 + parseInt(lines[train][1].textContent) * buttonSizeModifier + "px";
            }

            var circle = paper.circle(line[0][1], line[0][0], 10);
            var text = paper.text(line[0][1], line[0][0], "1")
            var pointTransmitter = paper.set();
            
            circle.attr('fill', '#f00');
            circle.attr('stroke', '#fff');
            pointTransmitter.push(text, circle)
            for (let i=0;i<line.length;i+=gameSpeed) {
                pointTransmitter.animate({x:line[Math.floor(i)][1]+11, y:line[Math.floor(i)][0]+11, cx:line[Math.floor(i)][1]+11, cy:line[Math.floor(i)][0]+11}, 0);
                yield -2;
            }
            pointTransmitter.remove();
            lines[train][2].textContent = parseInt(lines[train][2].textContent) + 1;
            if (stripPx(lines[train][2].style.height) != window.innerHeight) {
                lines[train][2].style.height = 30 + parseInt(lines[train][2].textContent) * buttonSizeModifier + "px";
                lines[train][2].style.width = 30 + parseInt(lines[train][2].textContent) * buttonSizeModifier + "px";
            } else {
                if (parseInt(lines[train][2].textContent) === totalAvailablePoints) {
                    var timeNow = performance.now();
                    alert("Level completed! Time: " + ((timeNow - startTime) / 1000).toString().toMMSS());
                }
            }
            return train;
        }
        return train;
    }

    function draw() {
        for (let i=0;i<trainTimers.length;i++) {
            if (trainTimers[i] === 0) {
                trainIterators.push([driveTrain(i), i]);
                trainTimers[i]--;
            } else if  (trainTimers[i] > 0) {
                trainTimers[i]--;
            }
        }
        for (let i=0;i<trainIterators.length;i++) {
            if (trainIterators[i] !== -1) {
                let currentVal = trainIterators[i][0].next().value;
                if (currentVal !== -2) {
                    trainTimers[currentVal] = spawnTimer;
                }
            }
        }
    }

    function gameLoop() {
        draw();
        requestAnimationFrame(gameLoop);
    }

    function drawBetweenButtons(b1, b2) {
        if (parseInt(document.getElementById('lineCount').innerHTML.substr(17)) > 0) {
            document.getElementById('lineCount').innerHTML = "Available Lines: " + (parseInt(document.getElementById('lineCount').innerHTML.substr(17))-1).toString();
            b1x = parseInt(b1.style.top, 10)+5;
            b1y = parseInt(b1.style.left, 10)+5;
            b2x = parseInt(b2.style.top, 10)+5;
            b2y = parseInt(b2.style.left, 10)+5;
            let path = [[b1x, b1y]];
            while (path[path.length-1][0]!==b2x || path[path.length-1][1]!==b2y) {
                currentPosX = path[path.length-1][0];
                currentPosY = path[path.length-1][1];
                if (currentPosX<b2x) {
                    path.push([currentPosX+1, currentPosY]);
                } else if (currentPosX>b2x) {
                    path.push([currentPosX-1, currentPosY]);
                } else if (currentPosY<b2y) {
                    path.push([currentPosX, currentPosY+1]);
                } else if (currentPosY>b2y) {
                    path.push([currentPosX, currentPosY-1]);
                }
            }
            var linePath = ["M", b1y, b1x];
            for (let i=1;i<path.length;i++) {
                linePath.push("L", path[i-1][1]+11, path[i-1][0]+11);
            }
            const thisTimerIndex = trainTimers.length-1;

            let width = "5px", strokeColor = "#f00";
            lines.forEach(line => {
                let counter = 0;
                if (line[0].length == path.length) {
                    for (let i=0;i<line[0].length;i++) {
                        let temp = 0;
                        for (let j=0;j<2;j++) {
                            if (line[0][i][j] === path[i][j]) {
                                temp++;
                            }
                        }
                        if (temp===2) {
                            counter++;
                        }
                    }
                    if (counter==line[0].length) {
                        width = "10px";
                        strokeColor = "#ff0";
                    }
                }
            });

            lines.push([path, b1, b2]);
            trainTimers.push(1);

            paper.path(linePath)
                .attr({"stroke": strokeColor, "stroke-width": width})
                .click((
                    function() {
                        removeLine(this, thisTimerIndex );
                    }
                ));
            flag = true;
        }
    }

    function trainIteratorFinder(index) {
        for (let i=0;i<trainIterators.length;i++) {
            if (trainIterators[i][1] === index) {
                return i;
            }
        }
    }

    function removeLine(line, index) {
        document.getElementById('lineCount').innerHTML = "Available Lines: " + (parseInt(document.getElementById('lineCount').innerHTML.substr(17))+1).toString();
        trainTimers[index] = -1;
        
        while (trainIterators[trainIteratorFinder(index)][0].next().value === -2) {
            console.log("DELTE IN PROGRESS.");
        }
        trainIterators[trainIteratorFinder(index)] = -1;
        line.remove();
    }

    function drawBetweenStartAndButton(start, button) {
        if (parseInt(document.getElementById('lineCount').innerHTML.substr(17)) > 0) {
            document.getElementById('lineCount').innerHTML = "Available Lines: " + (parseInt(document.getElementById('lineCount').innerHTML.substr(17))-1).toString();
            b1y = parseInt(start.style.left, 10)+5;
            b2x = parseInt(button.style.top, 10)+5;
            b2y = parseInt(button.style.left, 10)+5;
            let path = [[b2x, b1y]];
            while (path[path.length-1][1]!==b2y) {
                currentPosY = path[path.length-1][1];
                if (currentPosY<b2y) {
                    path.push([b2x, currentPosY+1]);
                } else if (currentPosY>b2y) {
                    path.push([b2x, currentPosY-1]);
                }
            }
            
            var linePath = ["M", b1y, b2x];
            for (let i=1;i<path.length;i++) {
                linePath.push("L", path[i-1][1]+11, path[i-1][0]+11);
            }
            const thisTimerIndex = trainTimers.length-1;

            let width = "5px", strokeColor = "#f00";
            lines.forEach(line => {
                let counter = 0;
                if (line[0].length == path.length) {
                    for (let i=0;i<line[0].length;i++) {
                        let temp = 0;
                        for (let j=0;j<2;j++) {
                            if (line[0][i][j] === path[i][j]) {
                                temp++;
                            }
                        }
                        if (temp===2) {
                            counter++;
                        }
                    }
                    if (counter==line[0].length) {
                        width = "10px";
                        strokeColor = "#ff0";
                    }
                }
            });

            lines.push([path, start, button]);
            trainTimers.push(1);

            paper.path(linePath)
                .attr({"stroke": strokeColor, "stroke-width": width})
                .click((
                    function() {
                        removeLine(this, thisTimerIndex);
                    }
                ));
            flag = true;
        }
    }

    function drawBetweenButtonAndEnd(button, end) {
        if (parseInt(document.getElementById('lineCount').innerHTML.substr(17)) > 0) {
            document.getElementById('lineCount').innerHTML = "Available Lines: " + (parseInt(document.getElementById('lineCount').innerHTML.substr(17))-1).toString();
            b1y = parseInt(button.style.left, 10)+5;
            b2x = parseInt(button.style.top, 10)+5;
            b2y = parseInt(end.style.left, 10)+5;
            let path = [[b2x, b1y]];
            while (path[path.length-1][1]!==b2y) {
                currentPosY = path[path.length-1][1];
                if (currentPosY<b2y) {
                    path.push([b2x, currentPosY+1]);
                } else if (currentPosY>b2y) {
                    path.push([b2x, currentPosY-1]);
                }
            }

            var linePath = ["M", b1y, b2x];
            for (let i=1;i<path.length;i++) {
                linePath.push("L", path[i-1][1]+11, path[i-1][0]+11);
            }
            const thisTimerIndex = trainTimers.length-1;

            let width = "5px", strokeColor = "#f00";
            lines.forEach(line => {
                let counter = 0;
                if (line[0].length == path.length) {
                    for (let i=0;i<line[0].length;i++) {
                        let temp = 0;
                        for (let j=0;j<2;j++) {
                            if (line[0][i][j] === path[i][j]) {
                                temp++;
                            }
                        }
                        if (temp===2) {
                            counter++;
                        }
                    }
                    if (counter==line[0].length) {
                        width = "10px";
                        strokeColor = "#ff0";
                    }
                }
            });

            lines.push([path, start, button]);
            trainTimers.push(1);

            paper.path(linePath)
                .attr({"stroke": strokeColor, "stroke-width": width})
                .click((
                    function() {
                        removeLine(this, thisTimerIndex);
                    }
                ));
            flag = true;
        }
    }

    function stationButtonClicked() {
        if (currentSelectedStation === null) {
            this.disabled = true;
            currentSelectedStation = this;
        } else {
            currentSelectedStation.disabled = false;
            if (stripPx(currentSelectedStation.style.height) == window.innerHeight) {  // Check if click is between start and button or two buttons
                drawBetweenStartAndButton(currentSelectedStation, this);
            } else if (stripPx(this.style.height) == window.innerHeight) {
                drawBetweenButtonAndEnd(currentSelectedStation, this);
            } else {
                drawBetweenButtons(currentSelectedStation, this);
            }
            currentSelectedStation = null;
        }
    }

    function findGetParameter(parameterName) {
        var result = null, tmp = [];
        location.search
            .substr(1)
            .split("&")
            .forEach(function (item) {
                tmp = item.split("=");
                if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
            });
        
        return result;
    }

    function stripPx(value) {
        return value.substr(0, value.length-2);
    }

    function updateTimer() {
        let timer = document.getElementById('timer')
        let minutes = parseInt(timer.innerHTML.substr(0, 2));
        let seconds = parseInt(timer.innerHTML.substr(3, 5));
        if (seconds < 59) {
            timer.innerHTML = minutes.toString().padStart(2, '0') + ":" + (seconds+1).toString().padStart(2, '0');
        } else {
            timer.innerHTML = (minutes+1).toString().padStart(2, '0') + ":00";
        }
        let failText = `${Math.floor(fail/60).toString().padStart(2, '0')}:${(fail%60).toString().padStart(2, '0')}`
        if (timer.innerHTML === failText) {
            alert("You failed!");
            window.location.reload();
        }
    }

    function setupTimer() {
        if (gold !== -1) {
            var text = document.createElement('p');
            text.id = "gold";
            text.innerHTML = `Gold: ${gold.toString().toMMSS()}`;
            text.style.top = "0px";
            text.style.left = window.innerWidth / 2 + "px";
            text.style.position = "absolute";
            document.body.appendChild(text);
        }
        if (silver !== -1) {
            var text = document.createElement('p');
            text.id = "silver";
            text.innerHTML = `Silver: ${silver.toString().toMMSS()}`;
            text.style.top = "20px";
            text.style.left = window.innerWidth / 2 + "px";
            text.style.position = "absolute";
            document.body.appendChild(text);
        }
        if (bronze !== -1) {
            var text = document.createElement('p');
            text.id = "bronze";
            text.innerHTML = `Bronze: ${bronze.toString().toMMSS()}`;
            text.style.top = "40px";
            text.style.left = window.innerWidth / 2 + "px";
            text.style.position = "absolute";
            document.body.appendChild(text);
        }
        if (fail !== -1) {
            var text = document.createElement('p');
            text.id = "fail";
            text.innerHTML = `Fail: ${fail.toString().toMMSS()}`;
            text.style.top = "60px";
            text.style.left = window.innerWidth / 2 + "px";
            text.style.position = "absolute";
            document.body.appendChild(text);
        }
        startTime = performance.now();
        var text = document.createElement('p');
        text.id = "timer";
        text.innerHTML = "00:00";
        text.style.top = "0px";
        text.style.left = window.innerWidth / 2 - 40 + "px";
        text.style.position = "absolute";
        document.body.appendChild(text);
        setInterval(function() {
            updateTimer();
        }, 1000);
    }

    function setupLineCounter() {
        var lineText = document.createElement('p');
        lineText.id = "lineCount";
        lineText.innerHTML = "Available Lines: 4";
        lineText.style.top = "0px";
        lineText.style.left = window.innerWidth*3 / 4 - 40 + "px";
        lineText.style.position = "absolute";
        document.body.appendChild(lineText);
    }

    function setupDividers() {
        paper.path(["M", 1/10 * window.innerWidth, 0, "L", 1/10 * window.innerWidth, window.innerHeight]).attr({"stroke-width": 5, "stroke": "grey"})
        paper.path(["M", 9/10 * window.innerWidth, 0, "L", 9/10 * window.innerWidth, window.innerHeight]).attr({"stroke-width": 5, "stroke": "grey"})
    }

    function createButton(x, y, width, height, className, value) {
        let button = document.createElement("button");
        button.textContent = value;
        totalAvailablePoints += parseInt(value);
        button.className = className;
        button.style.color = "white";
        button.style.background = "red";
        button.style.height = height + "px";
        button.style.width = width + "px";
        button.style.top = y + "px";
        button.style.left = x + "px";
        button.addEventListener('click', function(event) { stationButtonClicked.call(this); })
        document.body.appendChild(button);
    }

    function parseAndDrawLevelData(data) {
        let lineData = data.replace(/\r/g, "").split(/\n/);

        // Starting divider
        createButton(0, 0, 20, window.innerHeight, "startEndBarrier", lineData[0]);

        // Ending divider
        createButton(window.innerWidth-20, 0, 20, window.innerHeight, "startEndBarrier", 0);

        for (let i=0;i<parseInt(lineData[1]);i++) {
            let currentLine = lineData[i+2].split(" ");
            createButton(currentLine[1]-15, currentLine[2]-15, 30, 30, "circleButton", currentLine[0]);
        }
        gold = lineData[parseInt(lineData[1])+2];
        silver = lineData[parseInt(lineData[1])+3];
        bronze = lineData[parseInt(lineData[1])+4];
        fail = lineData[parseInt(lineData[1])+5];
    }
    
    function loadAndSetupButtons() {
        try {  // Load level data, or use random dots.
            parseAndDrawLevelData(document.getElementById("leveldata").innerHTML);
        } catch (TypeError) {
            // Starting divider
            createButton(0, 0, 20, window.innerHeight, "startEndBarrier", 10);

            // Ending divider
            createButton(window.innerWidth-20, 0, 20, window.innerHeight, "startEndBarrier", 0);

            for (let i=1;i<=10;i++) {  // Intermediary Buttons
                createButton(Math.floor(Math.random() * (window.innerWidth * 8/10)) + window.innerHeight * 1/10, Math.floor(Math.random() * (window.innerHeight - 25)), 30, 30, "circleButton", 5);
            }
        }
    }

    function gameSpeedButtonClicked(speed) {
        gameSpeed = speed;
    }

    function createGameSpeedButton(x, y, speed, onclickCallback) {
        let button = document.createElement("button");
        button.textContent = speed + "x";
        button.className = "gameSpeedButton"
        button.style.top = y + "px";
        button.style.left = x + "px";
        button.addEventListener('click', onclickCallback)
        document.body.appendChild(button);
    }

    function setupGameSpeedBar() {
        createGameSpeedButton(window.innerWidth / 4, 20, 1, function() {gameSpeedButtonClicked(1)});
        createGameSpeedButton(window.innerWidth / 4 + 29, 20, 2, function() {gameSpeedButtonClicked(2)});
        createGameSpeedButton(window.innerWidth / 4 + 57, 20, 5, function() {gameSpeedButtonClicked(5)});
        createGameSpeedButton(window.innerWidth / 4 + 85, 20, 10, function() {gameSpeedButtonClicked(10)});
    }

    function setup() {
        loadAndSetupButtons();
        setupDividers();
        setupTimer();
        setupLineCounter();
        setupGameSpeedBar();
        foundGameSpeed = parseFloat(findGetParameter("gameSpeed"));
        if (foundGameSpeed < 0.5 || Number.isInteger(foundGameSpeed)) {
            gameSpeed = parseFloat(foundGameSpeed);
        } else {
            console.log(`Invalid game speed '${foundGameSpeed}'.`);  
        }
        
        gameLoop();
    }
    
    setup();
})
// 1536 760