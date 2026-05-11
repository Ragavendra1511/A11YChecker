javascript:(function () {
    var d = document,
        id = 'phltsbkmklt',
        el = d.getElementById(id),
        f = d.querySelectorAll('iframe'),
        i = 0,
        l = f.length;

    // If style already exists, remove it
    if (el) {

        function removeFromShadows(root) {
            for (var el of root.querySelectorAll('*')) {
                if (el.shadowRoot) {
                    el.shadowRoot.getElementById(id).remove();
                    removeFromShadows(el.shadowRoot);
                }
            }
        }

        // Remove from main document
        el.remove();

        // Remove from iframes
        if (l) {
            for (i = 0; i < l; i++) {
                try {
                    f[i]
                        .contentWindow
                        .document
                        .getElementById(id)
                        .remove();

                    removeFromShadows(f[i].contentWindow.document);

                } catch (e) {
                    console.log(e);
                }
            }
        }

        // Remove from shadow DOMs
        removeFromShadows(d);

    } else {

        // Create style element
        s = d.createElement('style');
        s.id = id;

        // Apply accessibility spacing styles
        s.appendChild(
            d.createTextNode(
                '*{' +
                'line-height:1.5 !important;' +
                'letter-spacing:0.12em !important;' +
                'word-spacing:0.16em !important;' +
                '} ' +
                'p{' +
                'margin-bottom:2em !important;' +
                '}'
            )
        );

        // Additional selector rule
        s.appendChild(
            d.createTextNode(
                '*:not(#a #b #c #d #e #f #g #h #i){' +
                'line-height:1.5 !important;' +
                'letter-spacing:0.12em !important;' +
                'word-spacing:0.16em !important;' +
                '}'
            )
        );

        // Apply styles to shadow DOMs
        function applyToShadows(root) {
            for (var el of root.querySelectorAll('*')) {
                if (el.shadowRoot) {
                    el.shadowRoot.appendChild(s.cloneNode(true));
                    applyToShadows(el.shadowRoot);
                }
            }
        }

        // Apply to main document
        d.getElementsByTagName('head')[0].appendChild(s);

        // Apply to iframes
        for (i = 0; i < l; i++) {
            try {
                f[i]
                    .contentWindow
                    .document
                    .getElementsByTagName('head')[0]
                    .appendChild(s.cloneNode(true));

                applyToShadows(f[i].contentWindow.document);

            } catch (e) {
                console.log(e);
            }
        }

        // Apply to shadow DOMs in main document
        applyToShadows(d);
    }
})();
