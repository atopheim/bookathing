import { Jumbotron, Container } from "reactstrap";

const Greeting = (props) => {
  return (
    <div>
      <Jumbotron fluid>
        <Container fluid>
          <h1 className="display-3">O'leans washing club</h1>
          <p className="lead">
            Welcome to the simplest booking system. <br /> Press the "Book now" in
            the header to book your time slot!
          </p>
        </Container>
      </Jumbotron>
    </div>
  );
};

export default Greeting;
