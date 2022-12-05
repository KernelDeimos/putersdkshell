function tokenize (str) {
    console.log('<<<', str);
    let tokens = str.match(
        /((?<=")(?:[^"\\]|\\.)*(?="))|([A-Za-z]+)/g
    );
    tokens = tokens.map(tok => JSON.parse('"' + tok + '"'));
    console.log('>>>', tokens);
    return tokens || [];
}

function getAllProperties (obj) {
    const proto     = Object.getPrototypeOf(obj);
    const inherited = (proto && proto != Object.prototype) ? getAllProperties(proto) : [];
    const props = Object.getOwnPropertyNames(obj).map(name => {
        const desc = Object.getOwnPropertyDescriptor(obj, name);
        return { name, desc };
    })
    return [...props, ...inherited];
}

function valueToString (val) {
    if ( typeof val === 'function' ) {
        const valst = val.toString();
        const st = valst.indexOf('(') + 1;
        const en = valst.indexOf(')');

        const flags = ['-', '-'];

        if ( valst.startsWith('async') ) flags[0] = 'A';
        if ( val.prototype === undefined ) flags[1] = 'B';

        let args = valst.slice(st, en).split(',');
        args = args.filter(arg => arg.trim());

        return 'function ' + flags.join('') +
            ' (' + args.join(',') + ')'
    }
    return '' + val;
}

class CloudShell {
    static commands = {
        help (x) {
            this.outputter.writeLine(`
help         - show this text
list         - show members of Puter API
imode <mode> - change input mode
    <mode>: either "token" or "json".
    In "token" mode commands are entered normally,
    In JSON mode you must enter a valid JSON list in the prompt.
    When using JSON mode, ther outermost square brackets may be
    omitted.
eval  <text> - evaluate text as javascript

...          - if a command isn't found, the Puter API is
    then checked for a valid method.
                  
            `);
        },
        list (x) {
            const props = getAllProperties(this.cloud);
            for ( const prop of props ) {
                let line = prop.name + ' : ';
                const flags = ['-', '-', '-', '-', '-'];

                if ( prop.desc.configurable ) flags[0] = 'C';
                if ( prop.desc.writable ) flags[1] = 'W';
                if ( prop.desc.enumerable ) flags[2] = 'E';
                if ( prop.desc.get ) flags[3] = 'G';
                if ( prop.desc.set ) flags[4] = 'S';

                line += flags.join('');

                if ( ! prop.desc.get ) line += ' -> ' + valueToString(prop.desc.value);
                else line += ' -> <getter>'

                x.outputter.writeLine(line);
            }
        },
        async eval (x, code) {
            const output = (...a) => {
                x.outputter.writeLine(a.join(' '));
            }
            const cmethods = ['log', 'warn', 'error'];
            const rmethods = {};
            for ( const name of cmethods ) {
                rmethods[name] = console[name];
                console[name] = output;
            }
            const cloud = this.cloud;
            await (async () => {
                eval(code);
            })()
            for ( const name of cmethods ) {
                console[name] = rmethods[name];
            }
        },
        imode (x, mode) {
            const validModes = ['token', 'json'];
            if ( ! validModes.includes(mode) ) {
                x.outputter.writeLine('Not a valid input mode! Valid modes are: ' +
                    validModes.join(', '));
                x.outputter.writeLine('Keeping previous mode: ' + this.inputMode)
                return;
            }
            this.inputMode = mode;
            x.outputter.writeLine('input mode is now: ' + this.inputMode);
        }
    };

    constructor (o) {
        for ( const k in o ) this[k] = o[k];
        this.cloud = new Cloud();
        this.inputMode = 'token';
    }
    async writeLine (txt) {
        let tokens;
        if ( this.inputMode == 'json' ) {
            if ( ! txt.trim().startsWith('[') ) {
                txt = '[' + txt + ']';
            }
            tokens = JSON.parse(txt);
        } else {
            tokens = tokenize(txt);
        }
        const cmd = tokens.shift();
        await this.runCommand(cmd, tokens, this.outputter);
    }
    async runCommand (cmd, args, outputter) {
        if ( ! CloudShell.commands.hasOwnProperty(cmd) ) {
            if ( this.cloud[cmd] && typeof this.cloud[cmd] == 'function' ) {
                this.cloud[cmd](...args);
                return;
            }
            this.outputter.writeLine('command not found: ' + cmd);
            return;
        }
        CloudShell.commands[cmd].call(this, { outputter }, ...args);
    }
}

class Terminal {
    constructor (o) {
        for ( const k in o ) this[k] = o[k];
    }
    writeLine (txt) {
        const lineEl = document.createElement('div');
        lineEl.classList.add('terminal-line');
        const textEl = document.createTextNode(txt);
        lineEl.appendChild(textEl);
        this.outputEl.appendChild(lineEl);
    }
    bind () {
        this.promptEl.addEventListener('keydown', evt => {
            if ( evt.code === 'Enter' ) {
                evt.preventDefault();
                this.onEnter();
            }
        })
    }
    async onEnter () {
        const txt = this.promptEl.innerText;
        this.promptEl.innerText = '';
        this.writeLine('> ' + txt);
        await this.shell.writeLine(txt);
        this.outputEl.scrollTop = this.outputEl.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const rootEl = document.createElement('div');
    rootEl.setAttribute('id', 'frame');
    document.body.appendChild(rootEl);

    const outputEl = document.createElement('div');
    outputEl.classList.add('terminal-output');

    const promptEl = document.createElement('div');
    promptEl.classList.add('terminal-prompt');
    promptEl.setAttribute('contenteditable', true);

    rootEl.appendChild(outputEl);
    rootEl.appendChild(promptEl);

    const shell = new CloudShell();

    const term = new Terminal({
        shell,
        promptEl,
        outputEl
    });

    shell.outputter = term;

    term.writeLine("--- Puter SDK Shell (Unofficial) ---");
    term.writeLine("Type help or list to get started.");
    term.writeLine('');

    promptEl.focus();

    document.addEventListener('keydown', () => {
        promptEl.focus();
    })

    term.bind();
    // promptEl.addEventListener('blur', () => {
    //     promptEl.focus();
    // })
})