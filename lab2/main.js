var egg = ['./images/1.jpeg', './images/2.jpeg', './images/3.jpeg', './images/4.jpeg']
var additiveOsc = {} //array to push all additive oscillators 
var activeModulator = {}
var activeGain = {}
var activeDepth = {}
var activeLFO = {}

document.addEventListener("DOMContentLoaded", function (event) {

    var wave_type = 'sine'
    var waves = document.getElementById("select_wave").waves
    var activeGainNode = {}
    var frame = 0

    for (var i = 0; i < waves.length; i++) {
        waves[i].onclick = function () {
            wave_type = this.value;
        }
    }

    var mode_type = 'additive'
    var modes = document.getElementById("select_modes").mode

    for (var i = 0; i < modes.length; i++) {
        modes[i].onclick = function () {
            mode_type = this.value;
        }
    }

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const keyboardFrequencyMap = {
        '90': 261.625565300598634,  //Z - C
        '83': 277.182630976872096, //S - C#
        '88': 293.664767917407560,  //X - D
        '68': 311.126983722080910, //D - D#
        '67': 329.627556912869929,  //C - E
        '86': 349.228231433003884,  //V - F
        '71': 369.994422711634398, //G - F#
        '66': 391.995435981749294,  //B - G
        '72': 415.304697579945138, //H - G#
        '78': 440.000000000000000,  //N - A
        '74': 466.163761518089916, //J - A#
        '77': 493.883301256124111,  //M - B
        '81': 523.251130601197269,  //Q - C
        '50': 554.365261953744192, //2 - C#
        '87': 587.329535834815120,  //W - D
        '51': 622.253967444161821, //3 - D#
        '69': 659.255113825739859,  //E - E
        '82': 698.456462866007768,  //R - F
        '53': 739.988845423268797, //5 - F#
        '84': 783.990871963498588,  //T - G
        '54': 830.609395159890277, //6 - G#
        '89': 880.000000000000000,  //Y - A
        '55': 932.327523036179832, //7 - A#
        '85': 987.766602512248223,  //U - B
    }

    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);

    var activeOscillators = {}

    const globalGain = audioCtx.createGain(); //this will control the volume of all notes
    globalGain.gain.setValueAtTime(0.8, audioCtx.currentTime)
    globalGain.connect(audioCtx.destination);

    function keyDown(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && !activeOscillators[key] && mode_type == 'additive') {
            playAdditive(key);
            setTimeout(changeEgg, 50);
        }

        if (keyboardFrequencyMap[key] && !activeOscillators[key] && mode_type == 'lfo') {
            playLFOAdditive(key);
            setTimeout(changeEgg, 50);
        }

        else if (keyboardFrequencyMap[key] && !activeOscillators[key] && mode_type == 'am') {
            playAM(key)
            setTimeout(changeEgg, 50);

        }

        else if (keyboardFrequencyMap[key] && !activeOscillators[key] && mode_type == 'fm') {
            playFM(key)
            setTimeout(changeEgg, 50);

        }
    }

    function keyUp(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && activeOscillators[key] && mode_type == 'additive') {
            activeGainNode[key].gain.cancelScheduledValues(audioCtx.currentTime);
            activeGainNode[key].gain.setTargetAtTime(0, audioCtx.currentTime, 0.01); //release

            activeOscillators[key].stop(audioCtx.currentTime + 2);//not sure why it's throwing this error 
            delete activeOscillators[key];
            delete activeGainNode[key];

        }

        else if (keyboardFrequencyMap[key] && activeOscillators[key] && mode_type == 'lfo') {
            activeGainNode[key].gain.cancelScheduledValues(audioCtx.currentTime);
            activeGainNode[key].gain.setTargetAtTime(0, audioCtx.currentTime, 0.01); //release

            activeOscillators[key].stop(audioCtx.currentTime + 2);//not sure why it's throwing this error 
            activeLFO[key].stop();

            delete activeLFO[key];
            delete activeOscillators[key];
            delete activeGainNode[key];
        }

        else if (keyboardFrequencyMap[key] && activeOscillators[key] && mode_type == 'am') {
            activeGain[key].gain.cancelScheduledValues(audioCtx.currentTime);
            activeGain[key].gain.setValueAtTime(0.1, audioCtx.currentTime, 0.1); //release
            activeGain[key].gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.01); //release

            activeDepth[key].gain.cancelScheduledValues(audioCtx.currentTime);
            activeDepth[key].gain.setValueAtTime(0.1, audioCtx.currentTime, 0.01); //release
            activeDepth[key].gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.01); //release

            activeOscillators[key].stop()
            activeModulator[key].stop()

            delete activeOscillators[key];
            delete activeModulator[key];
            delete activeGain[key]; //this
            delete activeDepth[key]; //this

        }

        else if (keyboardFrequencyMap[key] && activeOscillators[key] && mode_type == 'fm') {
            activeGain[key].gain.cancelScheduledValues(audioCtx.currentTime);
            activeGain[key].gain.setValueAtTime(0.15, audioCtx.currentTime + 0.8, 0.8); //release
            activeGain[key].gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.4); //release

            activeOscillators[key].stop(audioCtx.currentTime + 0.1)
            activeModulator[key].stop(audioCtx.currentTime + 0.1)

            delete activeOscillators[key];
            delete activeModulator[key];
            delete activeGain[key];

        }
    }

    function playAdditive(key) {
        const baseOsc = audioCtx.createOscillator();
        baseOsc.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime)
        baseOsc.type = wave_type

        const gainNode = audioCtx.createGain(); //partialGain 
        gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime) //gentle fade in so no zero
        baseOsc.connect(gainNode);

        gainNode.gain.exponentialRampToValueAtTime(0.5, audioCtx.currentTime + 0.1); //reach peak
        gainNode.gain.exponentialRampToValueAtTime(0.4, audioCtx.currentTime + 0.8); //S

        const oscArray = audioCtx.createGain();
        oscArray.gain.setValueAtTime(0.01, audioCtx.currentTime)
        oscArray.connect(gainNode);
        additiveOsc[key] = [];

        //put arrays of oscillators 
        for (i = 0; i < 3; i += 1) {
            const osc = audioCtx.createOscillator()
            osc.frequency.setValueAtTime(keyboardFrequencyMap[key] * 2.0, audioCtx.currentTime)
            additiveOsc[key].push(osc)
            osc.connect(gainNode)
            osc.start()
        }

        var lfo = audioCtx.createOscillator();
        lfo.frequency.value = 20
        lfo.connect(gainNode)
        activeLFO[key] = lfo
        lfo.start()

        gainNode.connect(audioCtx.destination);
        baseOsc.start();

        activeOscillators[key] = baseOsc;
        activeGainNode[key] = gainNode;
    }

    function playLFOAdditive(key) {
        const baseOsc = audioCtx.createOscillator();
        baseOsc.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime)
        baseOsc.type = wave_type

        const gainNode = audioCtx.createGain(); //partialGain 
        gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime) //gentle fade in so no zero
        baseOsc.connect(gainNode);

        gainNode.gain.exponentialRampToValueAtTime(0.5, audioCtx.currentTime + 0.1); //reach peak
        gainNode.gain.exponentialRampToValueAtTime(0.4, audioCtx.currentTime + 0.8); //S

        const oscArray = audioCtx.createGain();
        oscArray.gain.setValueAtTime(0.01, audioCtx.currentTime)
        oscArray.connect(gainNode);
        additiveOsc[key] = [];

        //put arrays of oscillators 
        for (i = 0; i < 3; i += 1) {
            const osc = audioCtx.createOscillator()
            osc.frequency.setValueAtTime(keyboardFrequencyMap[key] * 2.0, audioCtx.currentTime)
            additiveOsc[key].push(osc)
            osc.connect(gainNode)
            osc.start()
        }

        //lfo part for additive 
        var lfo = audioCtx.createOscillator();
        lfo.frequency.value = 5
        lfo.connect(gainNode)
        activeLFO[key] = lfo
        lfo.start()

        gainNode.connect(audioCtx.destination);
        baseOsc.start();

        activeOscillators[key] = baseOsc;
        activeGainNode[key] = gainNode;
    }

    function playAM(key) {
        var carrier = audioCtx.createOscillator();
        var modulatorAM = audioCtx.createOscillator();
        modulatorAM.frequency.value = 100;
        carrier.frequency.value = keyboardFrequencyMap[key];

        const modulated = audioCtx.createGain(); //for AM purpose 
        const depth = audioCtx.createGain();
        depth.gain.value = 0.5
        modulated.gain.value = 1.0 - depth.gain.value

        modulatorAM.connect(depth).connect(modulated.gain);
        carrier.connect(modulated)
        modulated.connect(audioCtx.destination)

        activeOscillators[key] = carrier
        activeModulator[key] = modulatorAM
        activeGain[key] = modulated
        activeDepth[key] = depth

        modulatorAM.start();
        carrier.start()

        modulated.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + .1); //peak
        modulated.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + .8); //S

        depth.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + .1); //peak
        depth.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + .8); //S
    }

    function playFM(key) {
        var carrier = audioCtx.createOscillator();
        var modulatorFM = audioCtx.createOscillator();
        const modulationIndex = audioCtx.createGain();

        modulationIndex.gain.value = 40;
        modulatorFM.frequency.value = 50;
        carrier.frequency.value = keyboardFrequencyMap[key];

        modulatorFM.connect(modulationIndex)
        modulationIndex.connect(carrier.frequency)
        carrier.connect(audioCtx.destination);

        activeOscillators[key] = carrier
        activeModulator[key] = modulatorFM
        activeGain[key] = modulationIndex

        //here
        modulationIndex.gain.exponentialRampToValueAtTime(0.4, audioCtx.currentTime + 0.8); //peak
        modulationIndex.gain.exponentialRampToValueAtTime(0.35, audioCtx.currentTime + 0.5); //S

        carrier.start();
        modulatorFM.start();
    }

    function changeEgg() {
        if (frame == 4) {
            frame = 0
        }
        document.getElementById("eggo").src = egg[frame];
        frame++;
    }

    //dont know why this isn't showing up for functions? 
    function updateFreq(val) {
        modulatorAM.frequency.value = val;
    };
    function updateIndex(val) {
        modulated.gain.value = val;
    };

});