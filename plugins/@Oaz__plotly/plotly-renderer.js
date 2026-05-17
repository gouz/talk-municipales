class PlotlyCodeRenderer {
    constructor(selector) {
        this.selector = selector;
        this.states = new Map();
        this.init();
    }

    init() {
        document.querySelectorAll(this.selector).forEach(element => {
            this.states.set(element, {});
            this.renderPlot(element);
        });
    }

    tearDown() {
        // Clear all active repeat timers
        for (const [codeElement, state] of this.states.entries()) {
            if (state.timer) {
                clearTimeout(state.timer);
            }
        }
        this.states.clear();

        // Reset all processed elements for potential reuse
        document.querySelectorAll(this.selector).forEach(element => {
            element.dataset.plotlyProcessed = 'false';
            element.classList.remove('plotly-code--rendered', 'plotly-code--loading', 'plotly-code--error');
            element.style.display = '';

            // Remove any existing plot containers or error messages
            let nextSibling = element.nextSibling;
            while (nextSibling && (
                nextSibling.classList?.contains('plotly-container') ||
                nextSibling.classList?.contains('plotly-error')
            )) {
                const toRemove = nextSibling;
                nextSibling = nextSibling.nextSibling;
                toRemove.remove();
            }
        });
    }

    async renderPlot(codeElement) {
        // Clear any existing timer for this element
        this.clearRepeatTimer(codeElement);

        // Add loading state
        codeElement.classList.add('plotly-code--loading');

        try {
            const plotData = await this.evaluateCode(codeElement);
            const plotContainer = this.createPlotContainer(codeElement);
            await this.renderPlotly(plotContainer, plotData);

            // Success state
            codeElement.classList.remove('plotly-code--loading');
            codeElement.classList.add('plotly-code--rendered');
            codeElement.style.display = 'none';
            codeElement.dataset.plotlyProcessed = 'true';

            // Check for repeat property and set up auto-refresh
            this.setupRepeatIfNeeded(codeElement, plotData);
        } catch (error) {
            this.handleError(codeElement, error);
        }
    }

    setupRepeatIfNeeded(codeElement, plotData) {
        if (plotData && plotData.repeat && typeof plotData.repeat === 'number' && plotData.repeat > 0) {
            const timerId = setTimeout(() => {
                // Reset processing flag to allow re-rendering
                codeElement.dataset.plotlyProcessed = 'false';
                codeElement.classList.remove('plotly-code--rendered');
                
                // Remove existing plot container
                const existingContainer = codeElement.nextSibling;
                if (existingContainer && existingContainer.classList.contains('plotly-container')) {
                    existingContainer.remove();
                }
                
                // Re-render the plot
                this.renderPlot(codeElement);
            }, plotData.repeat);

            // Store timer ID in state object
            const state = this.states.get(codeElement);
            state.timer = timerId;
        }
    }

    clearRepeatTimer(codeElement) {
        const state = this.states.get(codeElement);
        if (state.timer) {
            clearTimeout(state.timer);
            state.timer = null;
        }
    }

    async evaluateCode(codeElement) {
        const code = codeElement.textContent.trim();
        
        // Get the state object for this element
        const state = this.states.get(codeElement);

        // Use Function constructor and pass state as argument
        const func = new Function('state', `return (${code})`);
        let result = func(state);

        // Handle async data functions
        if (typeof result === 'function') {
            result = await result(state);
        }

        if (result.state) {
            this.states.set(codeElement, result.state);
        }

        return result;
    }

    createPlotContainer(codeElement) {
        const container = document.createElement('div');
        container.className = 'plotly-container';
        codeElement.parentNode.insertBefore(container, codeElement.nextSibling);
        return container;
    }

    async renderPlotly(container, plotData) {
        if (!plotData) {
            throw new Error('No plot data provided');
        }

        const defaultConfig = {
            responsive: false,
            displayModeBar: false,
            displaylogo: false
        };

        // Default layout for presentation-friendly large text
        const presentationLayout = {
            height : 700,
            font: {
                size: 36,  // Base font size for all text
                family: 'Arial, sans-serif'
            },
            title: {
                font: { size: 40 }  // Even larger for titles
            },
            xaxis: {
                title: {
                    font: { size: 32 }    // X-axis title
                },
                tickfont: { size: 24 }      // X-axis tick labels
            },
            yaxis: {
                title: {
                    font: { size: 32 }    // Y-axis title
                },
                tickfont: { size: 24 }      // Y-axis tick labels
            },
            legend: {
                font: { size: 24 }          // Legend text
            }
        };

        if (plotData.data) {
            const layout = plotData.layout ? this.deepMerge(presentationLayout, plotData.layout) : presentationLayout;
            const config = { ...defaultConfig, ...(plotData.config || {}) };
            return Plotly.newPlot(container, plotData.data, layout, config);
        } else if (Array.isArray(plotData)) {
            return Plotly.newPlot(container, plotData, presentationLayout, defaultConfig);
        } else if (plotData.figure) {
            const layout = this.deepMerge(presentationLayout, plotData.figure.layout);
            const config = { ...defaultConfig, ...(plotData.config || {}) };
            return Plotly.newPlot(container, plotData.figure.data, layout, config);
        } else {
            throw new Error('Invalid Plotly data structure');
        }
    }

    deepMerge(target, source) {
        if (!source || typeof source !== 'object') {
            return source !== undefined ? source : target;
        }
        if (!target || typeof target !== 'object') {
            return source;
        }

        if (Array.isArray(source)) {
            return source;
        }
        if (Array.isArray(target)) {
            return source;
        }

        const result = { ...target };
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(target[key], source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }

        return result;
    }

    handleError(codeElement, error) {
        console.error('Plotly rendering error:', error);
        
        // Clear any repeat timer on error
        this.clearRepeatTimer(codeElement);
        
        codeElement.classList.remove('plotly-code--loading');
        codeElement.classList.add('plotly-code--error');
        codeElement.title = `Error: ${error.message}`;

        const errorDiv = document.createElement('div');
        errorDiv.className = 'plotly-error';
        errorDiv.innerHTML = `<strong>Plotly Error:</strong> ${error.message}`;

        codeElement.parentNode.insertBefore(errorDiv, codeElement.nextSibling);
    }
}
