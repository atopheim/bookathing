import { Jumbotron, Container } from "reactstrap";

const Greeting = (props) => {
  return (
    <div>
      <Jumbotron fluid>
        <Container fluid>
          <h1 className="display-3">Welcome</h1>
          <p className="lead">
            To the simplest booking system. <br /> Press the "Book now" in
            the header to book a thing!
          </p>
        </Container>
      </Jumbotron>
    </div>
  );
};

export default Greeting;
