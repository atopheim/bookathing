import { Container } from "reactstrap";
import doc1 from "../assets/img/doc1.jpg";
import washingmachine from "../assets/img/washingmachine.jpg";

const Information = () => {
  return (
    <div>
      <Container fluid>
        <div className="row m-3 d-flex align-items-center">
          <div className="col-12 col-md-6 p-5">
            <img src={doc1} alt="" width="100%" height="auto" />
          </div>
          <div className="col-12 col-md-6 text-center p-5">
            <h3 className="display-4">Book a dentist</h3>
            <p>
             Get rid of that tooth ache, ASAP!
            </p>
          </div>
        </div>
        <div className="row m-3 d-flex align-items-center">
          <div className="col-12 col-md-6 text-center p-5">
            <h3 className="display-4">Book a washing machine</h3>
            <p>
              #laundryday
            </p>
          </div>
          <div className="col-12 col-md-6 p-5">
            <img src={washingmachine} alt="" width="100%" height="auto" />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Information;
