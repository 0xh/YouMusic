import styled from "styled-components"

const Slider = styled.div`
    width: ${p => p.width};
    white-space: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: mandatory;
    scroll-snap-points-y: repeat(100%);
    font-size: 0;
`

export default Slider
