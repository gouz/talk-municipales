
window.slidesk.plotlyChange = () => {
    if(window.slidesk.plotlyCodeRenderer) {
        window.slidesk.plotlyCodeRenderer.tearDown();
        delete window.slidesk.plotlyCodeRenderer;
    }
    window.slidesk.plotlyCodeRenderer = new PlotlyCodeRenderer('.sd-current .language-plotly');
};

