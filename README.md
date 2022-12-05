# Puter SDK Shell

This is a shell for accessing Puter's cloud API from within Puter itself.
This can be useful for experimenting with the API and learning how to
develop applications for this platform.

## Usage

### Getting more information

The `help` command gives a short summary of builtin commands for
the Puter SDK shell. What it doesn't provide is SDK functions.

The `list` command will query all members of SDK. It will look
something like this:

```
onWindowClose : CWE-- -> undefined
onItemsOpened : CWE-- -> undefined
alert : CWE-- -> function -- (message,buttons,options,callback)
...
setWindowTitle : CWE-- -> function -- (title,callback)
launchApp : CWE-- -> function -- (appName,callback)
...
```

For each property 5 flags are shown - usually `CWE--`. The full
set of flags is `CWEGS`.
- `C`: Property is configurable
- `W`: Property is writable
- `E`: Property is enumerable
- `G`: Property has a getter (value will not be shown)
- `S`: Property has a setter

When typing a command that isn't a builtin command, it is assumed
to be a function in the Puter SDK.

### Executing a Puter SDK function

To execute a Puter SDK function, simply type its name

```
setWindowTitle "this is a test title"
```

Arguments are very simple tokens - either unquoted or double-quoted
strings with escaped double-quotes and backslashes.

Sometimes more complex arguments are needed, such as objects, arrays,
or the `null` keyword. This can be accomplished by changing the input
mode.

### Input Modes

The default input mode is `token`. This provides really basic token
parsing for commands. It's easy to use, but only allows you to pass
string arguments to the SDK functions.

Another input mode is `json`. To change to this input mode, use the
`imode` command.

```
imode json
```

Now, any token entered must be valid JSON. For example, to
switch back to the `token` input mode you would enter the following:

```
"imode", "token"
```

Notice the comma - these tokens are inside a JSON list. You can
optionally include the outermost brackets like this:

```
["imode", "token"]
```

While in the `json` input mode, the `setWindowTitle` command above
would look like this:

```
"setWindowTitle", "this is a test title"
```

### Using `eval`

The SDK terminal provides an `eval` command to help when the existing
terminal features aren't sufficient.

Here's an example which displays the environment variables:

```
imode json

"eval", "(async () => { let env = await cloud.env(); console.log(JSON.stringify(env)) })()"
```
