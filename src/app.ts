import * as SocketIOClient from 'socket.io-client';
import { Graphics } from 'phaser-ce';
import * as Rx from 'rxjs';

const game = new Phaser.Game(1280, 720, Phaser.AUTO);

const FINAL_TIME = Date.UTC(2018, 3, 1, 7);
// const FINAL_TIME = Date.UTC(2018, 2, 22, 6, 4);

const colors = {
    navy: "0x001f3f",
    aqua: "0x7FDBFF",
    olive: "0x3D9970",
    lime: "0x01FF70",
    orange: "0xFF851B",
    maroon: "0x85144b",
    purple: "0xB10DC9",
    gray: "0xAAAAAA",
    blue: "0x0074D9",
    teal: "0x39CCCC",
    green: "0x2ECC40",
    yellow: "0xFFDC00",
    red: "0xFF4136",
    fuchsia: "0xF012BE",
    black: "0x111111",
    silver: "0xDDDDDD",
    white: "0xFFFFFF",
}

class GameCanvas {
    height: number;
    width: number;
    grid: Array<Array<GameDot>>;

    constructor(width, height) {
        this.height = height;
        this.width = width;
        this.grid = Array(width).fill().map(()=>Array(height).fill());
    }

    populateGrid(gridData: Array<Array<any>>) {
        this.grid = this.grid.map( (col,i) => col.map( (el,j) => {
            if (gridData[`${i},${j}`]) {
                const dot = gridData[`${i},${j}`]
                return new GameDot(dot.color, dot.x, dot.y, dot.canChange, dot.lastPlayer);
            }
            else {
                return new GameDot(0xFFFFFF, i, j, true, "None");
            }
        }
        ))
    }
}

class GameDot {
    color: number;
    x: number;
    y: number;
    canChange: boolean;
    lastPlayer: string;

    constructor(color: number, x: number, y: number, canChange: boolean, lastPlayer: string) {
        this.color = color;
        this.x = x;
        this.y = y;
        this.canChange = canChange;
        this.lastPlayer = lastPlayer; 
    }

    setDot(x: number, y: number, color: number, canChange: boolean, lastPlayer: string) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.canChange = canChange;
        this.lastPlayer = lastPlayer;
    }
}

class canvasState extends Phaser.State {
    socket: SocketIOClient.Socket;
    canvas: GameCanvas;
    canvas_HEIGHT = 64;
    canvas_WIDTH = 128;

    timeText: Phaser.Text;

    hoveredDot: GameDot;
    popUpGraphics: Graphics;
    colorText: Phaser.Text;
    nameText: Phaser.Text;
    canChangeText: Phaser.Text;
    positionText: Phaser.Text;

    tipMessageText: Phaser.Text;
    dummyMessage: Phaser.Text;
    tipMessageTextTween: Phaser.Tween;

    tipMessageDataObserver: Rx.Subject<any>;

    init(gridData, socket) {
        this.canvas = new GameCanvas(this.canvas_WIDTH, this.canvas_HEIGHT);
        this.canvas.populateGrid(gridData);
        console.log(this.canvas.grid);
        this.socket = socket;

        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.pageAlignVertically = true;
        this.scale.pageAlignHorizontally = true;
        this.game.stage.backgroundColor = '#090849';
        this.game.stage.disableVisibilityChange = true;
    }

    create() {
        let graphics = game.add.graphics(0,0);

        this.paintGrid(graphics);
        
        graphics.beginFill(0x283149)
        graphics.drawRect(240,0, game.world.width - 240, 80);
        graphics.endFill();

        graphics.beginFill(0x000000)
        graphics.drawRect(0,0, 240, 80);
        graphics.endFill();

        /*
        graphics.beginFill(0x000000)
        graphics.drawRect(0,0, 1280, 80);
        graphics.endFill();
        */

        const style3 = {
            fill: "#FFF",
            font: "26px Press Start 2P",
        }
        const style4 = {
            fill: "#FFF",
            font: "12px Press Start 2P",
        }
        const style5 = {
            fill: "#FFF",
            font: "14px Press Start 2P",
        }

        const style6 = {
            fill: "#FFF",
            font: "14px Press Start 2P",
        }

        const style7 = {
            fill: "#FFF",
            font: "20px Press Start 2P"
        }

        this.dummyMessage = this.add.text(-1000, -1000, "DUMMY", style7);
        this.tipMessageText = this.add.text(1280, 30, "[None, $10]: This is not a true ending", style7);
        this.tipMessageTextTween = this.add.tween(this.tipMessageText);

        const timeBackground = this.add.graphics(0, 0);
        timeBackground.beginFill(0);
        timeBackground.drawRect(0, 0, 240, 80);
        timeBackground.endFill();
        
        this.timeText = this.add.text(125, 39, Date.now().toString(), style3);
        this.timeText.pivot.x = this.timeText.width/2;
        
        const hText = this.add.text(40, 68, "H", style4);
        // const hText = this.add.text(40+520, 68, "H", style4);
        const mText = this.add.text(120, 68, "M", style4);
        // const mText = this.add.text(120+520, 68, "M", style4);
        const sText = this.add.text(195, 68, "S", style4);
        // const sText = this.add.text(195+520, 68, "S", style4);

        const timeRemainingText = this.add.text(23, 10, "TIME REMAINING", style5);
        // const timeRemainingText = this.add.text(1280/2, 10, "TIME REMAINING", style5);
        // timeRemainingText.pivot.x = timeRemainingText.width/2;

        // Set up the popUp on hover thing
        this.popUpGraphics = game.add.graphics(-100, -100);
        this.popUpGraphics.beginFill(0x17202A);
        this.popUpGraphics.drawRect(0, 0, 410, 80);
        this.popUpGraphics.endFill();
        this.nameText = game.add.text(-100, -100, "", style6);
        this.colorText = game.add.text(-100, -100, "", style6);
        this.canChangeText = game.add.text(-100, -100, "", style6);
        this.positionText = game.add.text(-100, -100, "", style6);


        this.postCreate(graphics);
    }
    setTimeTexts() {
        const dateNow = Date.now();
        let delta;
        if (dateNow > FINAL_TIME) {
            delta = 0;
        } else {
            delta = FINAL_TIME - dateNow;
        }
        const hours = Math.floor(delta/(1000*60*60));
        const minutes = Math.floor(delta/(1000*60) - (hours*60)); 
        const seconds = Math.floor(delta/(1000) - (minutes*60) - (hours*60*60));

        const minutes2Digits = (minutes <= 9) ? `0${minutes}` : minutes; 
        const seconds2Digits = (seconds <= 9) ? `0${seconds}` : seconds;
        this.timeText.text = `${hours}:${minutes2Digits}:${seconds2Digits}`;
        this.timeText.pivot.x = this.timeText.width/2;
    }
    paintGrid(graphics) {
        this.canvas.grid.forEach(col => col.forEach( dot => this.paintDot(graphics, dot)));
    }
    paintDot(graphics, dot: GameDot, exalted = false) {
        // console.log('dot painted!!');
        if (!exalted) {
            graphics.beginFill(dot.color);
            graphics.drawRect(dot.x*10, dot.y*10+80, 10, 10);
            graphics.endFill();
        } else {
            graphics.beginFill(dot.color*0x1e1e1e);
            graphics.drawRect(dot.x*10, dot.y*10+80, 10, 10);
            graphics.endFill();
        }
    }

    createPopUp(dot: GameDot) {
        let xDisp = 0
        if (dot.x >= 88) {
           xDisp = -410; 
        }
        this.popUpGraphics.position = new Phaser.Point((dot.x*10) + xDisp, ((dot.y*10)+80)-80);

        this.nameText.position = new Phaser.Point((dot.x*10) + 2 + xDisp, (dot.y*10)+80-60 - 18);
        this.nameText.text = `Player: ${dot.lastPlayer}`;

        this.colorText.position = new Phaser.Point((dot.x*10) + 2 + xDisp, (dot.y*10)+80-60 + 2);

        let colorName;
        Object.keys(colors).forEach( (key) => {
            if (dot.color == colors[key]) {
                colorName = key;
            }
        })
        this.colorText.text = colorName? `Color: ${colorName}` : `Color: ${dot.color.toString(16).toUpperCase()}`;

        this.positionText.position = new Phaser.Point((dot.x*10) + 2 + xDisp, (dot.y*10)+80-60 + 22);
        this.positionText.text = `Position: (${dot.x}, ${dot.y})`;

        this.canChangeText.position = new Phaser.Point((dot.x*10) + 2 + xDisp, (dot.y*10)+80-60 + 42);
        this.canChangeText.text = dot.canChange ? `This pixel can be changed!`: `This pixel CANNOT be changed!`;
    }
    calculateMessageDuration(messageData) {
        this.dummyMessage.text = `[${messageData.username}, $${parseInt(messageData.amount)}]: ${messageData.message}$`;
        return (this.dummyMessage.width + 1280 + 1280 - 240)/0.15
    }
    runMessage(messageData) {
        if (!messageData.dummy) {
            console.log("Moving Message")
            this.tipMessageText.x = 1280;
            this.tipMessageText.text = `[${messageData.username}, $${parseInt(messageData.amount)}]: ${messageData.message}`;
            const tween = this.add.tween(this.tipMessageText);
            tween.to({x: 240 - this.tipMessageText.width}, this.calculateMessageDuration(messageData));
            tween.start();
        }
    }

    postCreate(graphics) {
        const self = this;

        this.socket.on('pixelData', data => {
            const dot = data.pixel;
            if (self.hoveredDot === self.canvas.grid[dot.x][dot.y]) {
                self.canvas.grid[dot.x][dot.y].setDot(dot.x, dot.y, dot.color, dot.canChange, dot.lastPlayer);
                self.paintDot(graphics, self.hoveredDot, true);
            } else {
                self.canvas.grid[dot.x][dot.y].setDot(dot.x, dot.y, dot.color, dot.canChange, dot.lastPlayer);
                self.paintDot(graphics, dot);
            }
        });

        const dummyMessageData = {
            dummy: true
        } 

        this.tipMessageDataObserver = new Rx.Subject();
        const streamObserver = this.tipMessageDataObserver
                                .concatMap(messageData => Rx.Observable.from([messageData]).concat(Rx.Observable.from([dummyMessageData]).delay(self.calculateMessageDuration(messageData)+100)))
        streamObserver.subscribe(messageData => self.runMessage(messageData));

        this.socket.on('tipMessage', messageData => {
            console.log(messageData);
            // truncate if messag is too long
            if (messageData.message && messageData.message.length > 200) {
                messageData.message = messageData.message.substring(0, 199);
            }
            self.tipMessageDataObserver.next(messageData);
        })
        /*
        setTimeout(() => {
            console.log(`New message received!`)
            this.tipMessageDataObserver.next({message: "hello dkashdkjashd aksjhd akjsdhakjsa"})
        }, 1000);
        setTimeout(() => {
            console.log(`New message received!`)
            this.tipMessageDataObserver.next({message: "hello2 aksdhaskdhas kdjahkdh askdh"})
        }, 3000);
        setTimeout(() => {
            console.log(`New message received!!`)
            this.tipMessageDataObserver.next({message: "Heellllo 33"})
        }, 3500);
        */
        window.addEventListener("mousemove", e => {
            const hoverX = Math.floor(game.input.x/10);
            const hoverY = Math.floor((game.input.y - 80)/10);
            // Check if hoverY >= 0, that is, if the mouse is over the canvas
            if (hoverY >= 0) {
                // If the hoveredDot is not defined, we created
                if (!this.hoveredDot) {
                    this.hoveredDot = this.canvas.grid[hoverX][hoverY];
                    this.paintDot(graphics, this.hoveredDot, true)
                    this.createPopUp(this.hoveredDot);
                }
                // If the hoveredDot is different to the current hovering dot, change the color of the hoveredDot and change it to the new one
                else if (this.hoveredDot !== this.canvas.grid[hoverX][hoverY]) {
                    // reset color of the hovered dot
                    this.paintDot(graphics, this.hoveredDot);
                    // set the new hovered dot and paint it
                    this.hoveredDot = this.canvas.grid[hoverX][hoverY];
                    this.paintDot(graphics, this.hoveredDot, true)
                    this.createPopUp(this.hoveredDot);
                }
            }
        })
    }

    update() {
        this.setTimeTexts();
    }
}

window.onload = () => {
    const socket = SocketIOClient();

    socket.on('gridData', data => {
        console.log(data)
        game.state.add('canvasState', canvasState);
        game.state.start('canvasState', true, false, data.grid, socket);
    })

    socket.emit('getGridData');
}