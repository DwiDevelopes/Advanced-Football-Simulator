        document.addEventListener('DOMContentLoaded', function() {
            // DOM elements
            const field = document.getElementById('field');
            const formationSelect = document.getElementById('formation');
            const teamTypeSelect = document.getElementById('team-type');
            const addFormationBtn = document.getElementById('add-formation');
            const clearFieldBtn = document.getElementById('clear-field');
            const ballPlayerSelect = document.getElementById('ball-player');
            const ballXInput = document.getElementById('ball-x');
            const ballYInput = document.getElementById('ball-y');
            const setBallPositionBtn = document.getElementById('set-ball-position');
            const formationPreview = document.getElementById('formation-preview');
            const playerInfo = document.getElementById('player-info');
            const closeInfo = document.getElementById('close-info');
            const startDrillBtn = document.getElementById('start-drill');
            const stopDrillBtn = document.getElementById('stop-drill');
            const drillTypeSelect = document.getElementById('drill-type');
            const playerCountSpan = document.getElementById('player-count');
            const ballPossessionSpan = document.getElementById('ball-possession');
            const passCountSpan = document.getElementById('pass-count');
            const shotCountSpan = document.getElementById('shot-count');
            const tackleCountSpan = document.getElementById('tackle-count');
            const distanceCoveredSpan = document.getElementById('distance-covered');
            const matchScoreSpan = document.getElementById('match-score');
            const matchTimerSpan = document.getElementById('match-timer');
            const matchEventsDiv = document.getElementById('match-events');
            const simulationModeSelect = document.getElementById('simulation-mode');
            const startMatchBtn = document.getElementById('start-match');
            const stopMatchBtn = document.getElementById('stop-match');
            const statsContent = document.getElementById('stats-content');
            const eventsContent = document.getElementById('events-content');
            const tabs = document.querySelectorAll('.tab');

            // Game state variables
            let players = [];
            let ball = null;
            let isDrillRunning = false;
            let isMatchRunning = false;
            let drillInterval = null;
            let matchInterval = null;
            let playerWithBall = null;
            let totalPasses = 0;
            let totalShots = 0;
            let totalTackles = 0;
            let totalDistance = 0;
            let teamScore = 0;
            let opponentScore = 0;
            let matchTime = 0; // in seconds
            let possessionStats = { team: 0, opponent: 0, none: 0 };
            let lastPossessionUpdate = Date.now();
            let matchEvents = [];
            let aiBehavior = 'balanced'; // Can be 'balanced', 'defensive', 'aggressive'

            // Initialize the ball
            function initBall() {
                if (ball) {
                    ball.remove();
                }
                ball = document.createElement('div');
                ball.className = 'ball';
                ball.style.left = '50%';
                ball.style.top = '50%';
                field.appendChild(ball);
                playerWithBall = null;
                updateBallPossessionDisplay();
            }

            // Add formation to the field
            function addFormation() {
                const formation = formationSelect.value;
                const teamType = teamTypeSelect.value;
                const [defenders, midfielders, attackers] = formation.split('-').map(Number);
                
                const fieldWidth = field.offsetWidth;
                const fieldHeight = field.offsetHeight;
                
                // Calculate positions for each line
                const positions = [];
                
                // Goalkeeper (always 1)
                positions.push({
                    x: teamType === 'team' ? 5 : 95,
                    y: 50,
                    position: 'GK'
                });
                
                // Defenders
                const defenderYStart = 50 - (defenders * 5);
                for (let i = 0; i < defenders; i++) {
                    positions.push({
                        x: teamType === 'team' ? 20 : 80,
                        y: defenderYStart + (i * (80 / Math.max(1, defenders-1))),
                        position: 'DF'
                    });
                }
                
                // Midfielders
                const midfielderYStart = 50 - (midfielders * 5);
                for (let i = 0; i < midfielders; i++) {
                    positions.push({
                        x: teamType === 'team' ? 40 : 60,
                        y: midfielderYStart + (i * (80 / Math.max(1, midfielders-1))),
                        position: 'MF'
                    });
                }
                
                // Attackers
                const attackerYStart = 50 - (attackers * 5);
                for (let i = 0; i < attackers; i++) {
                    positions.push({
                        x: teamType === 'team' ? 70 : 30,
                        y: attackerYStart + (i * (80 / Math.max(1, attackers-1))),
                        position: 'FW'
                    });
                }
                
                // Create players
                positions.forEach((pos, index) => {
                    const player = document.createElement('div');
                    const isGK = pos.position === 'GK';
                    player.className = `player ${teamType === 'opponent' ? 'opponent' : ''} ${isGK ? 'gk' : ''}`;
                    
                    const playerNumber = players.filter(p => p.team === teamType).length + 1;
                    player.textContent = playerNumber;
                    
                    // Convert percentage to pixels
                    const fieldRect = field.getBoundingClientRect();
                    const xPos = (pos.x / 100) * (fieldRect.width - 40);
                    const yPos = (pos.y / 100) * (fieldRect.height - 40);
                    
                    player.style.left = `${xPos}px`;
                    player.style.top = `${yPos}px`;
                    
                    const playerData = {
                        element: player,
                        team: teamType,
                        number: playerNumber,
                        position: pos.position,
                        x: pos.x,
                        y: pos.y,
                        distance: 0,
                        passes: 0,
                        shots: 0,
                        tackles: 0,
                        startX: pos.x,
                        startY: pos.y,
                        speed: isGK ? 0.5 : pos.position === 'DF' ? 0.8 : pos.position === 'MF' ? 1.0 : 1.2,
                        stamina: 100,
                        isGK: isGK
                    };
                    
                    // Make player draggable
                    makeDraggable(player, playerData);
                    
                    // Add click event to show info
                    player.addEventListener('click', function(e) {
                        e.stopPropagation();
                        showPlayerInfo(playerData);
                    });
                    
                    field.appendChild(player);
                    players.push(playerData);
                    
                    // Add to ball player select
                    const option = document.createElement('option');
                    option.value = `${teamType}-${playerNumber}`;
                    option.textContent = `${teamType === 'team' ? 'Team' : 'Opponent'} ${playerNumber} (${pos.position})`;
                    ballPlayerSelect.appendChild(option);
                });
                
                updatePlayerCount();
                updateFormationPreview();
            }
            
            // Make player element draggable
            function makeDraggable(element, playerData) {
                let isDragging = false;
                let offsetX, offsetY;
                
                element.addEventListener('mousedown', function(e) {
                    isDragging = true;
                    
                    // Calculate offset
                    const rect = element.getBoundingClientRect();
                    offsetX = e.clientX - rect.left;
                    offsetY = e.clientY - rect.top;
                    
                    element.style.zIndex = '100';
                    e.preventDefault();
                });
                
                document.addEventListener('mousemove', function(e) {
                    if (!isDragging) return;
                    
                    const fieldRect = field.getBoundingClientRect();
                    
                    // Calculate new position
                    let x = e.clientX - fieldRect.left - offsetX;
                    let y = e.clientY - fieldRect.top - offsetY;
                    
                    // Constrain to field
                    x = Math.max(0, Math.min(x, fieldRect.width - element.offsetWidth));
                    y = Math.max(0, Math.min(y, fieldRect.height - element.offsetHeight));
                    
                    // Update position
                    element.style.left = `${x}px`;
                    element.style.top = `${y}px`;
                    
                    // Update player data
                    playerData.x = (x / fieldRect.width) * 100;
                    playerData.y = (y / fieldRect.height) * 100;
                    
                    // Calculate distance moved from original position
                    const originalX = (playerData.startX / 100) * fieldRect.width;
                    const originalY = (playerData.startY / 100) * fieldRect.height;
                    const distance = Math.sqrt(Math.pow(x - originalX, 2) + Math.pow(y - originalY, 2));
                    
                    // Convert pixels to meters (assuming field is ~100m long)
                    const distanceMeters = (distance / fieldRect.width) * 100;
                    playerData.distance = distanceMeters;
                    
                    // Update total distance
                    updateTotalDistance();
                    
                    // If this player has the ball, move the ball with them
                    if (playerWithBall && playerWithBall.number === playerData.number && playerWithBall.team === playerData.team) {
                        moveBallToPlayer(playerData);
                    }
                });
                
                document.addEventListener('mouseup', function() {
                    if (isDragging) {
                        isDragging = false;
                        element.style.zIndex = '10';
                    }
                });
            }
            
            // Clear the field
            function clearField() {
                players.forEach(player => {
                    player.element.remove();
                });
                players = [];
                ballPlayerSelect.innerHTML = '<option value="">None</option>';
                formationPreview.innerHTML = '';
                updatePlayerCount();
                resetStats();
                
                if (isDrillRunning) {
                    stopDrill();
                }
                
                if (isMatchRunning) {
                    stopMatch();
                }
            }
            
            // Reset all statistics
            function resetStats() {
                totalPasses = 0;
                totalShots = 0;
                totalTackles = 0;
                totalDistance = 0;
                teamScore = 0;
                opponentScore = 0;
                matchTime = 0;
                possessionStats = { team: 0, opponent: 0, none: 0 };
                matchEvents = [];
                updateMatchEventsDisplay();
                
                passCountSpan.textContent = '0';
                shotCountSpan.textContent = '0';
                tackleCountSpan.textContent = '0';
                distanceCoveredSpan.textContent = '0m';
                matchScoreSpan.textContent = '0 - 0';
                matchTimerSpan.textContent = '00:00';
            }
            
            // Assign ball to player
            function assignBallToPlayer() {
                const selectedPlayer = ballPlayerSelect.value;
                if (!selectedPlayer) {
                    playerWithBall = null;
                    updateBallPossessionDisplay();
                    return;
                }
                
                const [team, number] = selectedPlayer.split('-');
                const player = players.find(p => p.team === team && p.number === parseInt(number));
                
                if (player) {
                    playerWithBall = player;
                    moveBallToPlayer(player);
                    updatePossessionStats(player.team);
                }
            }
            
            // Move ball to player position
            function moveBallToPlayer(player) {
                if (!ball) initBall();
                
                const fieldRect = field.getBoundingClientRect();
                const playerRect = player.element.getBoundingClientRect();
                
                const ballX = playerRect.left - fieldRect.left + playerRect.width / 2 - ball.offsetWidth / 2;
                const ballY = playerRect.top - fieldRect.top + playerRect.height / 2 - ball.offsetHeight / 2;
                
                ball.style.left = `${ballX}px`;
                ball.style.top = `${ballY}px`;
                
                updateBallPossessionDisplay();
            }
            
            // Set ball position manually
            function setBallPosition() {
                const x = parseFloat(ballXInput.value);
                const y = parseFloat(ballYInput.value);
                
                if (isNaN(x) || isNaN(y) || x < 0 || x > 100 || y < 0 || y > 100) {
                    alert('Please enter valid position values (0-100)');
                    return;
                }
                
                if (!ball) initBall();
                
                const fieldRect = field.getBoundingClientRect();
                const ballX = (x / 100) * (fieldRect.width - ball.offsetWidth);
                const ballY = (y / 100) * (fieldRect.height - ball.offsetHeight);
                
                ball.style.left = `${ballX}px`;
                ball.style.top = `${ballY}px`;
                
                // Find if ball is close to any player
                checkBallProximity();
            }
            
            // Check if ball is close to any player
            function checkBallProximity() {
                if (!ball) return;
                
                const fieldRect = field.getBoundingClientRect();
                const ballRect = ball.getBoundingClientRect();
                const ballCenterX = ballRect.left - fieldRect.left + ballRect.width / 2;
                const ballCenterY = ballRect.top - fieldRect.top + ballRect.height / 2;
                
                let closestPlayer = null;
                let minDistance = Infinity;
                
                players.forEach(player => {
                    const playerRect = player.element.getBoundingClientRect();
                    const playerCenterX = playerRect.left - fieldRect.left + playerRect.width / 2;
                    const playerCenterY = playerRect.top - fieldRect.top + playerRect.height / 2;
                    
                    const distance = Math.sqrt(
                        Math.pow(ballCenterX - playerCenterX, 2) + 
                        Math.pow(ballCenterY - playerCenterY, 2)
                    );
                    
                    // Consider "close" if within 30 pixels
                    if (distance < 30 && distance < minDistance) {
                        minDistance = distance;
                        closestPlayer = player;
                    }
                });
                
                if (closestPlayer) {
                    // Check if this is a tackle (ball changing teams)
                    if (playerWithBall && playerWithBall.team !== closestPlayer.team) {
                        closestPlayer.tackles++;
                        totalTackles++;
                        tackleCountSpan.textContent = totalTackles;
                        addMatchEvent(`${closestPlayer.team === 'team' ? 'Team' : 'Opponent'} ${closestPlayer.number} tackled ${playerWithBall.team === 'team' ? 'Team' : 'Opponent'} ${playerWithBall.number}`, 'tackle');
                    }
                    
                    playerWithBall = closestPlayer;
                    moveBallToPlayer(closestPlayer);
                    updatePossessionStats(closestPlayer.team);
                    
                    // If this is a new player with the ball, count as a pass
                    if (playerWithBall && (!playerWithBall.lastPossession || 
                        playerWithBall.lastPossession < Date.now() - 1000)) {
                        if (playerWithBall.lastPossession) {
                            playerWithBall.passes++;
                            totalPasses++;
                            passCountSpan.textContent = totalPasses;
                            addMatchEvent(`${playerWithBall.team === 'team' ? 'Team' : 'Opponent'} ${playerWithBall.number} received pass`, 'pass');
                        }
                        playerWithBall.lastPossession = Date.now();
                    }
                    
                    // Check for goal scoring opportunity
                    if (isMatchRunning && closestPlayer.position === 'FW' && 
                        Math.random() < 0.3 && !closestPlayer.isGK) {
                        attemptShot(closestPlayer);
                    }
                } else {
                    playerWithBall = null;
                    updatePossessionStats('none');
                }
            }
            
            // Attempt a shot at goal
            function attemptShot(player) {
                if (!ball || !playerWithBall || playerWithBall !== player) return;
                
                const fieldRect = field.getBoundingClientRect();
                const ballRect = ball.getBoundingClientRect();
                const ballCenterX = ballRect.left - fieldRect.left + ballRect.width / 2;
                const ballCenterY = ballRect.top - fieldRect.top + ballRect.height / 2;
                
                // Determine which goal to shoot at
                const isTeamShooting = player.team === 'team';
                const goalX = isTeamShooting ? fieldRect.width : 0;
                const goalY = fieldRect.height / 2;
                
                // Calculate shot direction
                const dx = goalX - ballCenterX;
                const dy = (goalY + (Math.random() * 40 - 20)) - ballCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Animate the shot
                animateShot(ballCenterX, ballCenterY, dx, dy, distance, player);
                
                // Update stats
                player.shots++;
                totalShots++;
                shotCountSpan.textContent = totalShots;
                addMatchEvent(`${player.team === 'team' ? 'Team' : 'Opponent'} ${player.number} shoots!`, 'shot');
            }
            
            // Animate a shot at goal
            function animateShot(startX, startY, dx, dy, distance, shooter) {
                if (!ball) return;
                
                // Create a temporary ball for the animation
                const tempBall = document.createElement('div');
                tempBall.className = 'ball';
                tempBall.style.position = 'absolute';
                tempBall.style.left = `${startX}px`;
                tempBall.style.top = `${startY}px`;
                field.appendChild(tempBall);
                
                // Hide the real ball during shot
                ball.style.visibility = 'hidden';
                playerWithBall = null;
                updateBallPossessionDisplay();
                
                const duration = Math.min(1000, distance * 2); // ms
                const startTime = performance.now();
                
                function animateShotStep(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Quadratic ease-out for more realistic ball movement
                    const easedProgress = 1 - Math.pow(1 - progress, 3);
                    
                    const x = startX + dx * easedProgress;
                    const y = startY + dy * easedProgress;
                    
                    tempBall.style.left = `${x}px`;
                    tempBall.style.top = `${y}px`;
                    
                    // Check for goal collision
                    const fieldRect = field.getBoundingClientRect();
                    const goalLeft = document.querySelector('.goal.left').getBoundingClientRect();
                    const goalRight = document.querySelector('.goal.right').getBoundingClientRect();
                    const ballRect = {
                        left: x + fieldRect.left,
                        top: y + fieldRect.top,
                        right: x + fieldRect.left + 20,
                        bottom: y + fieldRect.top + 20
                    };
                    
                    // Check collision with left goal (team shooting right)
                    if (shooter.team === 'team' && ballRect.right >= goalRight.left && 
                        ballRect.top >= goalRight.top && ballRect.bottom <= goalRight.bottom) {
                        scoreGoal('team');
                        tempBall.remove();
                        resetBallAfterShot();
                        return;
                    }
                    
                    // Check collision with right goal (opponent shooting left)
                    if (shooter.team === 'opponent' && ballRect.left <= goalLeft.right && 
                        ballRect.top >= goalLeft.top && ballRect.bottom <= goalLeft.bottom) {
                        scoreGoal('opponent');
                        tempBall.remove();
                        resetBallAfterShot();
                        return;
                    }
                    
                    // Check if ball went out of bounds
                    if (x <= 0 || x >= fieldRect.width || y <= 0 || y >= fieldRect.height) {
                        tempBall.remove();
                        resetBallAfterShot();
                        return;
                    }
                    
                    // Check for player collisions during shot
                    let intercepted = false;
                    players.forEach(player => {
                        if (intercepted) return;
                        
                        const playerRect = player.element.getBoundingClientRect();
                        
                        // Simple collision detection
                        if (ballRect.right >= playerRect.left && 
                            ballRect.left <= playerRect.right &&
                            ballRect.bottom >= playerRect.top && 
                            ballRect.top <= playerRect.bottom) {
                            
                            // Different team can intercept
                            if (player.team !== shooter.team) {
                                intercepted = true;
                                playerWithBall = player;
                                moveBallToPlayer(player);
                                updatePossessionStats(player.team);
                                addMatchEvent(`${player.team === 'team' ? 'Team' : 'Opponent'} ${player.number} intercepted!`, 'tackle');
                            }
                        }
                    });
                    
                    if (intercepted) {
                        tempBall.remove();
                        return;
                    }
                    
                    if (progress < 1) {
                        requestAnimationFrame(animateShotStep);
                    } else {
                        // Shot missed
                        tempBall.remove();
                        resetBallAfterShot();
                    }
                }
                
                requestAnimationFrame(animateShotStep);
            }
            
            // Reset ball after a shot
            function resetBallAfterShot() {
                if (!ball) return;
                
                ball.style.visibility = 'visible';
                
                // Place ball near the goal if shot was missed
                if (!playerWithBall) {
                    const fieldRect = field.getBoundingClientRect();
                    const isTeamShot = teamScore > opponentScore; // Just a simple way to alternate
                    
                    if (isTeamShot) {
                        // Place near opponent's goal
                        ball.style.left = `${fieldRect.width - 50}px`;
                        ball.style.top = `${fieldRect.height / 2}px`;
                    } else {
                        // Place near team's goal
                        ball.style.left = '50px';
                        ball.style.top = `${fieldRect.height / 2}px`;
                    }
                    
                    checkBallProximity();
                }
            }
            
            // Score a goal
            function scoreGoal(team) {
                if (team === 'team') {
                    teamScore++;
                    addMatchEvent('GOAL for Team!', 'goal');
                } else {
                    opponentScore++;
                    addMatchEvent('GOAL for Opponent!', 'goal');
                }
                
                matchScoreSpan.textContent = `${teamScore} - ${opponentScore}`;
                
                // Highlight score briefly
                matchScoreSpan.style.transform = 'scale(1.2)';
                matchScoreSpan.style.transition = 'transform 0.3s';
                setTimeout(() => {
                    matchScoreSpan.style.transform = 'scale(1)';
                }, 300);
                
                // Reset ball to center
                setTimeout(() => {
                    if (ball) {
                        const fieldRect = field.getBoundingClientRect();
                        ball.style.left = `${fieldRect.width / 2 - 10}px`;
                        ball.style.top = `${fieldRect.height / 2 - 10}px`;
                        playerWithBall = null;
                        updateBallPossessionDisplay();
                    }
                }, 1000);
            }
            
            // Update formation preview
            function updateFormationPreview() {
                formationPreview.innerHTML = '';
                
                const formation = formationSelect.value;
                const [defenders, midfielders, attackers] = formation.split('-').map(Number);
                const teamType = teamTypeSelect.value;
                
                // Goalkeeper
                const gkRow = document.createElement('div');
                gkRow.className = 'formation-row';
                const gkPlayer = document.createElement('div');
                gkPlayer.className = `formation-player ${teamType === 'opponent' ? 'opponent' : ''} gk`;
                gkRow.appendChild(gkPlayer);
                formationPreview.appendChild(gkRow);
                
                // Defenders
                const defRow = document.createElement('div');
                defRow.className = 'formation-row';
                for (let i = 0; i < defenders; i++) {
                    const player = document.createElement('div');
                    player.className = `formation-player ${teamType === 'opponent' ? 'opponent' : ''}`;
                    defRow.appendChild(player);
                }
                formationPreview.appendChild(defRow);
                
                // Midfielders
                const midRow = document.createElement('div');
                midRow.className = 'formation-row';
                for (let i = 0; i < midfielders; i++) {
                    const player = document.createElement('div');
                    player.className = `formation-player ${teamType === 'opponent' ? 'opponent' : ''}`;
                    midRow.appendChild(player);
                }
                formationPreview.appendChild(midRow);
                
                // Attackers
                const attRow = document.createElement('div');
                attRow.className = 'formation-row';
                for (let i = 0; i < attackers; i++) {
                    const player = document.createElement('div');
                    player.className = `formation-player ${teamType === 'opponent' ? 'opponent' : ''}`;
                    attRow.appendChild(player);
                }
                formationPreview.appendChild(attRow);
            }
            
            // Show player info
            function showPlayerInfo(player) {
                document.getElementById('info-name').textContent = `${player.team === 'team' ? 'Team' : 'Opponent'} ${player.number}`;
                document.getElementById('info-position').textContent = getPositionName(player.position);
                document.getElementById('info-team').textContent = player.team === 'team' ? 'My Team' : 'Opponent';
                document.getElementById('info-distance').textContent = `${player.distance.toFixed(1)}m`;
                document.getElementById('info-passes').textContent = player.passes;
                document.getElementById('info-shots').textContent = player.shots;
                document.getElementById('info-tackles').textContent = player.tackles;
                
                // Position the info box near the player
                const fieldRect = field.getBoundingClientRect();
                const playerRect = player.element.getBoundingClientRect();
                
                const infoX = playerRect.left - fieldRect.left + playerRect.width;
                const infoY = playerRect.top - fieldRect.top;
                
                playerInfo.style.left = `${Math.min(infoX, fieldRect.width - 160)}px`;
                playerInfo.style.top = `${Math.min(infoY, fieldRect.height - 120)}px`;
                playerInfo.style.display = 'block';
            }
            
            // Get full position name
            function getPositionName(shortPos) {
                const positions = {
                    'GK': 'Goalkeeper',
                    'DF': 'Defender',
                    'MF': 'Midfielder',
                    'FW': 'Forward'
                };
                return positions[shortPos] || shortPos;
            }
            
            // Update player count display
            function updatePlayerCount() {
                const teamCount = players.filter(p => p.team === 'team').length;
                const opponentCount = players.filter(p => p.team === 'opponent').length;
                playerCountSpan.textContent = `${teamCount} (Team) / ${opponentCount} (Opponent)`;
            }
            
            // Update ball possession display
            function updateBallPossessionDisplay() {
                if (playerWithBall) {
                    ballPossessionSpan.textContent = `${playerWithBall.team === 'team' ? 'Team' : 'Opponent'} ${playerWithBall.number}`;
                    ballPossessionSpan.style.color = playerWithBall.team === 'team' ? 'var(--secondary-color)' : 'var(--accent-color)';
                } else {
                    ballPossessionSpan.textContent = 'None';
                    ballPossessionSpan.style.color = '#333';
                }
                
                // Update possession stats
                const totalPossession = possessionStats.team + possessionStats.opponent + possessionStats.none;
                if (totalPossession > 0) {
                    const teamPercent = Math.round((possessionStats.team / totalPossession) * 100);
                    const opponentPercent = Math.round((possessionStats.opponent / totalPossession) * 100);
                    ballPossessionSpan.title = `Possession: Team ${teamPercent}% - ${opponentPercent}% Opponent`;
                }
            }
            
            // Update possession statistics
            function updatePossessionStats(team) {
                const now = Date.now();
                const timeDiff = now - lastPossessionUpdate;
                
                if (playerWithBall) {
                    possessionStats[playerWithBall.team] += timeDiff;
                } else {
                    possessionStats.none += timeDiff;
                }
                
                lastPossessionUpdate = now;
                updateBallPossessionDisplay();
            }
            
            // Update total distance covered
            function updateTotalDistance() {
                totalDistance = players.reduce((sum, player) => sum + player.distance, 0);
                distanceCoveredSpan.textContent = `${totalDistance.toFixed(1)}m`;
            }
            
            // Add match event to log
            function addMatchEvent(text, type) {
                const now = new Date();
                const timeStr = `${String(Math.floor(matchTime / 60)).padStart(2, '0')}:${String(matchTime % 60).padStart(2, '0')}`;
                
                matchEvents.unshift({
                    time: timeStr,
                    text: text,
                    type: type
                });
                
                // Keep only the last 20 events
                if (matchEvents.length > 20) {
                    matchEvents.pop();
                }
                
                updateMatchEventsDisplay();
            }
            
            // Update match events display
            function updateMatchEventsDisplay() {
                matchEventsDiv.innerHTML = '';
                
                matchEvents.forEach(event => {
                    const eventElement = document.createElement('div');
                    eventElement.className = `event ${event.type}`;
                    eventElement.textContent = `[${event.time}] ${event.text}`;
                    matchEventsDiv.appendChild(eventElement);
                });
            }
            
            // Start drill
            function startDrill() {
                if (isDrillRunning) return;
                
                const drillType = drillTypeSelect.value;
                isDrillRunning = true;
                startDrillBtn.disabled = true;
                stopDrillBtn.disabled = false;
                
                // Save starting positions
                players.forEach(player => {
                    player.startX = player.x;
                    player.startY = player.y;
                    player.distance = 0;
                });
                totalDistance = 0;
                distanceCoveredSpan.textContent = '0m';
                
                // Different behaviors based on drill type
                switch (drillType) {
                    case 'passing':
                        drillInterval = setInterval(() => {
                            if (players.length === 0) return;
                            
                            // Randomly pass the ball between players of the same team
                            if (playerWithBall) {
                                const teamPlayers = players.filter(p => p.team === playerWithBall.team);
                                if (teamPlayers.length > 1) {
                                    const otherPlayers = teamPlayers.filter(p => p !== playerWithBall);
                                    const receiver = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
                                    
                                    // Animate pass
                                    animatePass(playerWithBall, receiver);
                                    
                                    // Update stats
                                    playerWithBall.passes++;
                                    totalPasses++;
                                    passCountSpan.textContent = totalPasses;
                                    addMatchEvent(`${playerWithBall.team === 'team' ? 'Team' : 'Opponent'} ${playerWithBall.number} passes to ${receiver.number}`, 'pass');
                                    
                                    playerWithBall = receiver;
                                    updateBallPossessionDisplay();
                                    updatePossessionStats(receiver.team);
                                }
                            } else if (players.length > 0) {
                                // Assign to random player if no one has the ball
                                playerWithBall = players[Math.floor(Math.random() * players.length)];
                                moveBallToPlayer(playerWithBall);
                                updatePossessionStats(playerWithBall.team);
                            }
                        }, 2000);
                        break;
                        
                    case 'positioning':
                        drillInterval = setInterval(() => {
                            // Players move slightly around their positions
                            players.forEach(player => {
                                const newX = parseFloat(player.element.style.left) + (Math.random() * 20 - 10);
                                const newY = parseFloat(player.element.style.top) + (Math.random() * 20 - 10);
                                
                                // Constrain to field
                                const fieldRect = field.getBoundingClientRect();
                                const constrainedX = Math.max(0, Math.min(newX, fieldRect.width - player.element.offsetWidth));
                                const constrainedY = Math.max(0, Math.min(newY, fieldRect.height - player.element.offsetHeight));
                                
                                player.element.style.left = `${constrainedX}px`;
                                player.element.style.top = `${constrainedY}px`;
                                
                                // Update player data
                                player.x = (constrainedX / fieldRect.width) * 100;
                                player.y = (constrainedY / fieldRect.height) * 100;
                                
                                // Update distance
                                const originalX = (player.startX / 100) * fieldRect.width;
                                const originalY = (player.startY / 100) * fieldRect.height;
                                const distance = Math.sqrt(Math.pow(constrainedX - originalX, 2) + Math.pow(constrainedY - originalY, 2));
                                player.distance = (distance / fieldRect.width) * 100;
                            });
                            
                            updateTotalDistance();
                        }, 500);
                        break;
                        
                    case 'pressing':
                        drillInterval = setInterval(() => {
                            // Players move toward the ball
                            if (!ball) return;
                            
                            const ballRect = ball.getBoundingClientRect();
                            const ballCenterX = ballRect.left + ballRect.width / 2;
                            const ballCenterY = ballRect.top + ballRect.height / 2;
                            
                            players.forEach(player => {
                                const playerRect = player.element.getBoundingClientRect();
                                const playerCenterX = playerRect.left + playerRect.width / 2;
                                const playerCenterY = playerRect.top + playerRect.height / 2;
                                
                                // Calculate direction to ball
                                const dx = ballCenterX - playerCenterX;
                                const dy = ballCenterY - playerCenterY;
                                const distance = Math.sqrt(dx * dx + dy * dy);
                                
                                // Move toward ball but not all the way
                                const moveX = dx * 0.02 * player.speed;
                                const moveY = dy * 0.02 * player.speed;
                                
                                const newX = parseFloat(player.element.style.left) + moveX;
                                const newY = parseFloat(player.element.style.top) + moveY;
                                
                                // Constrain to field
                                const fieldRect = field.getBoundingClientRect();
                                const constrainedX = Math.max(0, Math.min(newX, fieldRect.width - player.element.offsetWidth));
                                const constrainedY = Math.max(0, Math.min(newY, fieldRect.height - player.element.offsetHeight));
                                
                                player.element.style.left = `${constrainedX}px`;
                                player.element.style.top = `${constrainedY}px`;
                                
                                // Update player data
                                player.x = (constrainedX / fieldRect.width) * 100;
                                player.y = (constrainedY / fieldRect.height) * 100;
                                
                                // Update distance
                                const originalX = (player.startX / 100) * fieldRect.width;
                                const originalY = (player.startY / 100) * fieldRect.height;
                                const distMoved = Math.sqrt(Math.pow(constrainedX - originalX, 2) + Math.pow(constrainedY - originalY, 2));
                                player.distance = (distMoved / fieldRect.width) * 100;
                                
                                // If close to ball and different team, attempt tackle
                                if (distance < 30 && playerWithBall && playerWithBall.team !== player.team) {
                                    if (Math.random() < 0.3) { // 30% chance of successful tackle
                                        player.tackles++;
                                        totalTackles++;
                                        tackleCountSpan.textContent = totalTackles;
                                        addMatchEvent(`${player.team === 'team' ? 'Team' : 'Opponent'} ${player.number} tackles ${playerWithBall.team === 'team' ? 'Team' : 'Opponent'} ${playerWithBall.number}`, 'tackle');
                                        
                                        playerWithBall = player;
                                        moveBallToPlayer(player);
                                        updatePossessionStats(player.team);
                                    }
                                }
                            });
                            
                            updateTotalDistance();
                        }, 100);
                        break;
                        
                    case 'counter':
                        drillInterval = setInterval(() => {
                            // Players make counter-attack movements
                            players.forEach(player => {
                                let moveX, moveY;
                                
                                if (player.team === 'team') {
                                    // Attackers move forward
                                    if (player.position === 'FW') {
                                        moveX = 5 * player.speed;
                                        moveY = (Math.random() * 4 - 2) * player.speed;
                                    } 
                                    // Midfielders move slightly forward
                                    else if (player.position === 'MF') {
                                        moveX = 2 * player.speed;
                                        moveY = (Math.random() * 3 - 1.5) * player.speed;
                                    }
                                    // Defenders move slightly forward
                                    else if (player.position === 'DF') {
                                        moveX = 1 * player.speed;
                                        moveY = (Math.random() * 2 - 1) * player.speed;
                                    }
                                    // GK stays
                                    else {
                                        moveX = 0;
                                        moveY = 0;
                                    }
                                } else {
                                    // Opponents retreat
                                    if (player.position === 'FW') {
                                        moveX = -3 * player.speed;
                                        moveY = (Math.random() * 4 - 2) * player.speed;
                                    } 
                                    else if (player.position === 'MF') {
                                        moveX = -2 * player.speed;
                                        moveY = (Math.random() * 3 - 1.5) * player.speed;
                                    }
                                    else if (player.position === 'DF') {
                                        moveX = -1 * player.speed;
                                        moveY = (Math.random() * 2 - 1) * player.speed;
                                    }
                                    else {
                                        moveX = 0;
                                        moveY = 0;
                                    }
                                }
                                
                                const newX = parseFloat(player.element.style.left) + moveX;
                                const newY = parseFloat(player.element.style.top) + moveY;
                                
                                // Constrain to field
                                const fieldRect = field.getBoundingClientRect();
                                const constrainedX = Math.max(0, Math.min(newX, fieldRect.width - player.element.offsetWidth));
                                const constrainedY = Math.max(0, Math.min(newY, fieldRect.height - player.element.offsetHeight));
                                
                                player.element.style.left = `${constrainedX}px`;
                                player.element.style.top = `${constrainedY}px`;
                                
                                // Update player data
                                player.x = (constrainedX / fieldRect.width) * 100;
                                player.y = (constrainedY / fieldRect.height) * 100;
                                
                                // Update distance
                                const originalX = (player.startX / 100) * fieldRect.width;
                                const originalY = (player.startY / 100) * fieldRect.height;
                                const distMoved = Math.sqrt(Math.pow(constrainedX - originalX, 2) + Math.pow(constrainedY - originalY, 2));
                                player.distance = (distMoved / fieldRect.width) * 100;
                            });
                            
                            updateTotalDistance();
                            
                            // Randomly pass the ball forward for counter-attack
                            if (playerWithBall && playerWithBall.team === 'team' && Math.random() < 0.3) {
                                const teamPlayers = players.filter(p => p.team === 'team' && p !== playerWithBall);
                                const forwardPlayers = teamPlayers.filter(p => p.position === 'FW' || p.position === 'MF');
                                
                                if (forwardPlayers.length > 0) {
                                    const receiver = forwardPlayers[Math.floor(Math.random() * forwardPlayers.length)];
                                    animatePass(playerWithBall, receiver);
                                    
                                    playerWithBall.passes++;
                                    totalPasses++;
                                    passCountSpan.textContent = totalPasses;
                                    addMatchEvent(`Team ${playerWithBall.number} passes to ${receiver.number}`, 'pass');
                                    
                                    playerWithBall = receiver;
                                    updateBallPossessionDisplay();
                                    updatePossessionStats(receiver.team);
                                }
                            }
                        }, 200);
                        break;
                        
                    case 'shooting':
                        drillInterval = setInterval(() => {
                            if (players.length === 0) return;
                            
                            // Find team players with the ball
                            if (playerWithBall && playerWithBall.team === 'team') {
                                // 50% chance to shoot if in attacking position
                                if ((playerWithBall.position === 'FW' || 
                                    (playerWithBall.position === 'MF' && parseFloat(playerWithBall.element.style.left) > field.offsetWidth * 0.6))) {
                                    if (Math.random() < 0.5) {
                                        attemptShot(playerWithBall);
                                    }
                                }
                            } else if (players.length > 0) {
                                // Assign to random team player if no one has the ball
                                const teamPlayers = players.filter(p => p.team === 'team');
                                if (teamPlayers.length > 0) {
                                    playerWithBall = teamPlayers[Math.floor(Math.random() * teamPlayers.length)];
                                    moveBallToPlayer(playerWithBall);
                                    updatePossessionStats(playerWithBall.team);
                                }
                            }
                        }, 1500);
                        break;
                }
            }
            
            // Stop drill
            function stopDrill() {
                if (!isDrillRunning) return;
                
                clearInterval(drillInterval);
                isDrillRunning = false;
                startDrillBtn.disabled = false;
                stopDrillBtn.disabled = true;
            }
            
            // Start match
            function startMatch() {
                if (isMatchRunning) return;
                
                // Check if both teams are set up
                const teamCount = players.filter(p => p.team === 'team').length;
                const opponentCount = players.filter(p => p.team === 'opponent').length;
                
                if (teamCount === 0 || opponentCount === 0) {
                    alert('Please set up both teams before starting a match');
                    return;
                }
                
                isMatchRunning = true;
                startMatchBtn.disabled = true;
                stopMatchBtn.disabled = false;
                startDrillBtn.disabled = true;
                stopDrillBtn.disabled = true;
                
                // Reset stats
                resetStats();
                
                // Start match timer
                matchInterval = setInterval(() => {
                    matchTime++;
                    const minutes = Math.floor(matchTime / 60);
                    const seconds = matchTime % 60;
                    matchTimerSpan.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                    
                    // Update possession stats
                    updatePossessionStats(playerWithBall ? playerWithBall.team : 'none');
                    
                    // AI behavior for opponent team
                    if (playerWithBall && playerWithBall.team === 'opponent') {
                        // Decide whether to pass or shoot
                        if (Math.random() < 0.3) { // 30% chance to make a move each second
                            if (playerWithBall.position === 'FW' && 
                                parseFloat(playerWithBall.element.style.left) < field.offsetWidth * 0.4) {
                                // In shooting position
                                if (Math.random() < 0.6) {
                                    attemptShot(playerWithBall);
                                }
                            } else {
                                // Look for a pass
                                const teamPlayers = players.filter(p => p.team === 'opponent' && p !== playerWithBall);
                                const forwardPlayers = teamPlayers.filter(p => p.position === 'FW' || 
                                    (p.position === 'MF' && parseFloat(p.element.style.left) < parseFloat(playerWithBall.element.style.left)));
                                
                                if (forwardPlayers.length > 0) {
                                    const receiver = forwardPlayers[Math.floor(Math.random() * forwardPlayers.length)];
                                    animatePass(playerWithBall, receiver);
                                    
                                    playerWithBall.passes++;
                                    totalPasses++;
                                    passCountSpan.textContent = totalPasses;
                                    addMatchEvent(`Opponent ${playerWithBall.number} passes to ${receiver.number}`, 'pass');
                                    
                                    playerWithBall = receiver;
                                    updateBallPossessionDisplay();
                                    updatePossessionStats(receiver.team);
                                }
                            }
                        }
                    } else if (!playerWithBall) {
                        // Assign ball to random player
                        if (Math.random() < 0.1) { // 10% chance per second
                            const randomTeam = Math.random() < 0.5 ? 'team' : 'opponent';
                            const teamPlayers = players.filter(p => p.team === randomTeam);
                            if (teamPlayers.length > 0) {
                                playerWithBall = teamPlayers[Math.floor(Math.random() * teamPlayers.length)];
                                moveBallToPlayer(playerWithBall);
                                updatePossessionStats(playerWithBall.team);
                                addMatchEvent(`${playerWithBall.team === 'team' ? 'Team' : 'Opponent'} ${playerWithBall.number} gains possession`, 'pass');
                            }
                        }
                    }
                    
                    // Team AI (if not controlled by user)
                    if (playerWithBall && playerWithBall.team === 'team' && Math.random() < 0.2) {
                        const teamPlayers = players.filter(p => p.team === 'team' && p !== playerWithBall);
                        const forwardPlayers = teamPlayers.filter(p => p.position === 'FW' || 
                            (p.position === 'MF' && parseFloat(p.element.style.left) > parseFloat(playerWithBall.element.style.left)));
                        
                        if (forwardPlayers.length > 0) {
                            const receiver = forwardPlayers[Math.floor(Math.random() * forwardPlayers.length)];
                            animatePass(playerWithBall, receiver);
                            
                            playerWithBall.passes++;
                            totalPasses++;
                            passCountSpan.textContent = totalPasses;
                            addMatchEvent(`Team ${playerWithBall.number} passes to ${receiver.number}`, 'pass');
                            
                            playerWithBall = receiver;
                            updateBallPossessionDisplay();
                            updatePossessionStats(receiver.team);
                        }
                    }
                    
                    // Players move according to match situation
                    players.forEach(player => {
                        if (player.isGK) return; // GK stays in position
                        
                        // Basic positioning logic
                        let targetX, targetY;
                        const fieldRect = field.getBoundingClientRect();
                        const playerX = parseFloat(player.element.style.left);
                        const playerY = parseFloat(player.element.style.top);
                        
                        if (player.team === 'team') {
                            // Team players position based on their role
                            if (player.position === 'DF') {
                                targetX = fieldRect.width * 0.25;
                                targetY = fieldRect.height * (0.3 + 0.4 * (player.number % 4) / 4);
                            } else if (player.position === 'MF') {
                                targetX = fieldRect.width * 0.5;
                                targetY = fieldRect.height * (0.2 + 0.6 * (player.number % 4) / 4);
                            } else { // FW
                                targetX = fieldRect.width * 0.75;
                                targetY = fieldRect.height * (0.3 + 0.4 * (player.number % 3) / 3);
                            }
                        } else {
                            // Opponent players position based on their role
                            if (player.position === 'DF') {
                                targetX = fieldRect.width * 0.75;
                                targetY = fieldRect.height * (0.3 + 0.4 * (player.number % 4) / 4);
                            } else if (player.position === 'MF') {
                                targetX = fieldRect.width * 0.5;
                                targetY = fieldRect.height * (0.2 + 0.6 * (player.number % 4) / 4);
                            } else { // FW
                                targetX = fieldRect.width * 0.25;
                                targetY = fieldRect.height * (0.3 + 0.4 * (player.number % 3) / 3);
                            }
                        }
                        
                        // Move toward target position
                        const dx = targetX - playerX;
                        const dy = targetY - playerY;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance > 10) { // Only move if not close to target
                            const moveX = dx * 0.02 * player.speed;
                            const moveY = dy * 0.02 * player.speed;
                            
                            const newX = playerX + moveX;
                            const newY = playerY + moveY;
                            
                            // Constrain to field
                            const constrainedX = Math.max(0, Math.min(newX, fieldRect.width - player.element.offsetWidth));
                            const constrainedY = Math.max(0, Math.min(newY, fieldRect.height - player.element.offsetHeight));
                            
                            player.element.style.left = `${constrainedX}px`;
                            player.element.style.top = `${constrainedY}px`;
                            
                            // Update player data
                            player.x = (constrainedX / fieldRect.width) * 100;
                            player.y = (constrainedY / fieldRect.height) * 100;
                            
                            // Update distance
                            const originalX = (player.startX / 100) * fieldRect.width;
                            const originalY = (player.startY / 100) * fieldRect.height;
                            const distMoved = Math.sqrt(Math.pow(constrainedX - originalX, 2) + Math.pow(constrainedY - originalY, 2));
                            player.distance = (distMoved / fieldRect.width) * 100;
                        }
                    });
                    
                    updateTotalDistance();
                    
                }, 1000); // Update every second
                
                // Start with ball in center
                initBall();
                const fieldRect = field.getBoundingClientRect();
                ball.style.left = `${fieldRect.width / 2 - 10}px`;
                ball.style.top = `${fieldRect.height / 2 - 10}px`;
                
                // Randomly assign first possession
                setTimeout(() => {
                    const randomTeam = Math.random() < 0.5 ? 'team' : 'opponent';
                    const teamPlayers = players.filter(p => p.team === randomTeam && p.position === 'MF');
                    if (teamPlayers.length > 0) {
                        playerWithBall = teamPlayers[Math.floor(Math.random() * teamPlayers.length)];
                        moveBallToPlayer(playerWithBall);
                        updatePossessionStats(playerWithBall.team);
                        addMatchEvent(`Match starts! ${playerWithBall.team === 'team' ? 'Team' : 'Opponent'} gains possession`, 'pass');
                    }
                }, 500);
            }
            
            // Stop match
            function stopMatch() {
                if (!isMatchRunning) return;
                
                clearInterval(matchInterval);
                isMatchRunning = false;
                startMatchBtn.disabled = false;
                stopMatchBtn.disabled = true;
                startDrillBtn.disabled = false;
                
                addMatchEvent('Match ended!', 'pass');
            }
            
            // Animate pass between players
            function animatePass(sender, receiver) {
                if (!ball) return;
                
                const senderRect = sender.element.getBoundingClientRect();
                const receiverRect = receiver.element.getBoundingClientRect();
                const fieldRect = field.getBoundingClientRect();
                
                const startX = senderRect.left - fieldRect.left + senderRect.width / 2 - ball.offsetWidth / 2;
                const startY = senderRect.top - fieldRect.top + senderRect.height / 2 - ball.offsetHeight / 2;
                
                const endX = receiverRect.left - fieldRect.left + receiverRect.width / 2 - ball.offsetWidth / 2;
                const endY = receiverRect.top - fieldRect.top + receiverRect.height / 2 - ball.offsetHeight / 2;
                
                // Create a temporary ball for the animation
                const tempBall = document.createElement('div');
                tempBall.className = 'ball';
                tempBall.style.position = 'absolute';
                tempBall.style.left = `${startX}px`;
                tempBall.style.top = `${startY}px`;
                field.appendChild(tempBall);
                
                // Hide the real ball during pass
                ball.style.visibility = 'hidden';
                
                // Animate the pass
                const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                const duration = Math.min(1000, distance * 2); // ms
                const startTime = performance.now();
                
                function animatePassStep(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Quadratic ease-out for more realistic ball movement
                    const easedProgress = 1 - Math.pow(1 - progress, 2);
                    
                    // Parabolic trajectory
                    const x = startX + (endX - startX) * easedProgress;
                    const y = startY + (endY - startY) * easedProgress - 50 * Math.sin(progress * Math.PI);
                    
                    tempBall.style.left = `${x}px`;
                    tempBall.style.top = `${y}px`;
                    
                    // Check for interceptions
                    let intercepted = false;
                    players.forEach(player => {
                        if (intercepted || player === sender || player === receiver) return;
                        
                        const playerRect = player.element.getBoundingClientRect();
                        const playerX = playerRect.left - fieldRect.left + playerRect.width / 2;
                        const playerY = playerRect.top - fieldRect.top + playerRect.height / 2;
                        
                        const ballDistance = Math.sqrt(Math.pow(x - playerX, 2) + Math.pow(y - playerY, 2));
                        
                        // Different team can intercept
                        if (ballDistance < 30 && player.team !== sender.team) {
                            if (Math.random() < 0.7) { // 70% chance of interception
                                intercepted = true;
                                playerWithBall = player;
                                player.tackles++;
                                totalTackles++;
                                tackleCountSpan.textContent = totalTackles;
                                addMatchEvent(`${player.team === 'team' ? 'Team' : 'Opponent'} ${player.number} intercepts!`, 'tackle');
                            }
                        }
                    });
                    
                    if (intercepted) {
                        tempBall.remove();
                        moveBallToPlayer(playerWithBall);
                        ball.style.visibility = 'visible';
                        return;
                    }
                    
                    if (progress < 1) {
                        requestAnimationFrame(animatePassStep);
                    } else {
                        // Pass complete
                        tempBall.remove();
                        ball.style.visibility = 'visible';
                        moveBallToPlayer(receiver);
                    }
                }
                
                requestAnimationFrame(animatePassStep);
            }
            
            // Tab switching
            tabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    // Remove active class from all tabs
                    tabs.forEach(t => t.classList.remove('active'));
                    // Add active class to clicked tab
                    this.classList.add('active');
                    
                    // Hide all tab contents
                    document.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.remove('active');
                    });
                    
                    // Show corresponding content
                    const tabId = this.getAttribute('data-tab');
                    document.getElementById(`${tabId}-content`).classList.add('active');
                });
            });
            
            // Event listeners
            addFormationBtn.addEventListener('click', addFormation);
            clearFieldBtn.addEventListener('click', clearField);
            ballPlayerSelect.addEventListener('change', assignBallToPlayer);
            setBallPositionBtn.addEventListener('click', setBallPosition);
            formationSelect.addEventListener('change', updateFormationPreview);
            teamTypeSelect.addEventListener('change', updateFormationPreview);
            closeInfo.addEventListener('click', function() {
                playerInfo.style.display = 'none';
            });
            startDrillBtn.addEventListener('click', startDrill);
            stopDrillBtn.addEventListener('click', stopDrill);
            startMatchBtn.addEventListener('click', startMatch);
            stopMatchBtn.addEventListener('click', stopMatch);
            
            // Click on field to hide player info
            field.addEventListener('click', function() {
                playerInfo.style.display = 'none';
            });
            
            // Initialize
            initBall();
            updateFormationPreview();
        });