import { Component } from "react";
import "./DestinationStyles.css";

class DestinationData extends Component {
  render() {
    return (
      <div className={this.props.className}>
        <div className="des-text">
          {this.props.eyebrow && <p className="destination-eyebrow">{this.props.eyebrow}</p>}
          <h2>{this.props.heading}</h2>
          <p>{this.props.text}</p>
        </div>
        <div className="image">
          <img src={this.props.img1} alt="Mountain 1" />
          <img src={this.props.img2} alt="Mountain 2" />
        </div>
      </div>
    );
  }
}

export default DestinationData;
