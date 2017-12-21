import { PcdrPage } from './app.po';

describe('pcdr App', () => {
  let page: PcdrPage;

  beforeEach(() => {
    page = new PcdrPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
