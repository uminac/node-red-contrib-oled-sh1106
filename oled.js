var i2c = require('i2c-bus');
var i2cBus = i2c.openSync(1);
var font = require('oled-font-5x7');
var SH1106 = require('./sh1106');

module.exports = function(RED) {
  var displays = {};

  ('---------------------------------- Function ----------------------------------');
  function OledFunction(fn) {
    return function(n) {
      var self = this;
      RED.nodes.createNode(self, n);
      self.display = displays[n.display];
      self.on('input', function(msg) {
        self.display[fn](msg.payload);
        self.display.update();
      });
    };
  }

  ('---------------------------------- Check ----------------------------------');
  function check(display, node) {
    if (node.clear) {
      if (display.initOLED() === true) display.clearDisplay();
      // display.setCursor(1, 1)
      // display.update()
    }
  }

  ('---------------------------------- Config ----------------------------------');
  function OledConfig(config) {
    var self = this;
    RED.nodes.createNode(self, config);
    self.config = {
      address: parseInt('0x' + config.address),
      width: parseInt(config.width),
      height: parseInt(config.height)
    };
    // displays[self.id] = new Oled(i2cBus, self.config)
    displays[self.id] = SH1106;
    check(displays[self.id], { clear: true });
  }


  '---------------------------------- Text ----------------------------------'
	function Text(n) {
		var self = this
		RED.nodes.createNode(self, n)
    
		self.display = displays[n.display]

		self.on('input', function(msg) {
			check(self.display, n)
			try {
        
				if (typeof msg.payload === 'object') {
					var p = msg.payload
					if (p.x || p.y) {
						self.display.setCursor(p.x || 1, p.y || 1)
					}
					self.display.writeString(
						font,
						p.size,
						p.text
					)
				} else {
					self.display.setCursor(1, 1)
					self.display.writeString(font, 1, msg.payload, 1, true)
				}
			} catch (err) {
				self.error(err)
			}
		})
	}

  '---------------------------------- StringAtPage ----------------------------------'
  function StringAtPage(n) {
    var self = this;
    RED.nodes.createNode(self, n);

    self.display = displays[n.display];

    self.on('input', function(msg) {
      check(self.display, n);
      try {
        if (typeof msg.payload === 'object') {
          var p = msg.payload;
          if (p.size && p.line && p.text) {
            self.display.writeStringAtPage(font, p.size, p.line, p.text);
          } else {
            self.display.writeStringAtPage(font, 1, 0, p.text);
          }
        }
      } catch (err) {
        self.error(err);
      }
    });
  }

  ('---------------------------------- Registration ----------------------------------');
  RED.nodes.registerType('oled-sh1106-config', OledConfig);
  RED.nodes.registerType('StringAtPage', StringAtPage);
  RED.nodes.registerType('Text', Text);
};
