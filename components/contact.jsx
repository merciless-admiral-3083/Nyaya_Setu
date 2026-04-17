import React from 'react';

class Contact extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      email: '',
      message: '',
      submitted: false
    };
  }

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    // In production, you would send this data to a backend
    // For now, just show success message
    this.setState({
      name: '',
      email: '',
      message: '',
      submitted: true
    });

    // Reset success message after 5 seconds
    setTimeout(() => {
      this.setState({ submitted: false });
    }, 5000);
  };

  render() {
    return (
      <div className="min-h-screen bg-[#F4F1EB]">
        {/* Header Section */}
        <section className="bg-[#1A2B4A] text-white py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-georgia">
              Contact Us
            </h1>
            <p className="text-xl text-[#F5B942]">
              We&apos;d love to hear from you
            </p>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              {this.state.submitted ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="text-2xl font-bold text-[#1A2B4A] mb-2">
                    धन्यवाद! Thank You!
                  </h3>
                  <p className="text-gray-700">
                    Your message has been received. We&apos;ll get back to you soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={this.handleSubmit}>
                  {/* Name Field */}
                  <div className="mb-6">
                    <label
                      htmlFor="name"
                      className="block text-[#1A2B4A] font-bold mb-2 font-georgia"
                    >
                      Name / नाम
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={this.state.name}
                      onChange={this.handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#E8762D] focus:outline-none transition-colors"
                      placeholder="Enter your name"
                    />
                  </div>

                  {/* Email Field */}
                  <div className="mb-6">
                    <label
                      htmlFor="email"
                      className="block text-[#1A2B4A] font-bold mb-2 font-georgia"
                    >
                      Email / ईमेल
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={this.state.email}
                      onChange={this.handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#E8762D] focus:outline-none transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>

                  {/* Message Field */}
                  <div className="mb-6">
                    <label
                      htmlFor="message"
                      className="block text-[#1A2B4A] font-bold mb-2 font-georgia"
                    >
                      Message / संदेश
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={this.state.message}
                      onChange={this.handleChange}
                      required
                      rows="5"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#E8762D] focus:outline-none transition-colors resize-none"
                      placeholder="Tell us how we can help..."
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-[#E8762D] hover:bg-[#d66520] text-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Send Message / संदेश भेजें
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-[#1A2B4A] mb-12 font-georgia">
              Meet the Team
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Team Member 1 */}
              <div className="bg-[#F4F1EB] rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-24 h-24 bg-[#1A2B4A] rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl text-white">👨‍💻</span>
                </div>
                <h3 className="text-xl font-bold text-[#1A2B4A] mb-1">
                  Development Team
                </h3>
                <p className="text-[#E8762D] text-sm mb-3">Full Stack Developers</p>
                <p className="text-gray-600 text-sm">
                  Building accessible legal tech for every Indian
                </p>
              </div>

              {/* Team Member 2 */}
              <div className="bg-[#F4F1EB] rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-24 h-24 bg-[#1A2B4A] rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl text-white">🎨</span>
                </div>
                <h3 className="text-xl font-bold text-[#1A2B4A] mb-1">
                  Design Team
                </h3>
                <p className="text-[#E8762D] text-sm mb-3">UI/UX Designers</p>
                <p className="text-gray-600 text-sm">
                  Crafting intuitive experiences rooted in Indian culture
                </p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-12 text-center">
              <div className="bg-[#1A2B4A] text-white rounded-xl p-8">
                <h3 className="text-2xl font-bold mb-4 font-georgia">
                  NyayaSetu Mission
                </h3>
                <p className="text-[#F4F1EB] mb-4">
                  NyayaSetu is built for the Open Innovation track, addressing the
                  critical gap in access to legal aid in India.
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-[#F5B942]">
                  <span className="bg-[#1A2B4A] border border-[#F5B942] px-4 py-2 rounded-full text-sm">
                    💻 Full Stack + AI Track
                  </span>
                  <span className="bg-[#1A2B4A] border border-[#F5B942] px-4 py-2 rounded-full text-sm">
                    🇮🇳 Made in India
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Info Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="bg-white rounded-xl shadow p-6">
                <div className="text-3xl mb-3">📧</div>
                <h4 className="font-bold text-[#1A2B4A] mb-1">Email</h4>
                <p className="text-gray-600 text-sm">contact@nyayasetu.org</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <div className="text-3xl mb-3">📍</div>
                <h4 className="font-bold text-[#1A2B4A] mb-1">Location</h4>
                <p className="text-gray-600 text-sm">Greater Noida, India</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <div className="text-3xl mb-3">🌐</div>
                <h4 className="font-bold text-[#1A2B4A] mb-1">Follow Us</h4>
                <p className="text-gray-600 text-sm">@NyayaSetu</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

export default Contact;