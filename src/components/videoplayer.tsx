export const VideoPlayer = () => {
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 w-full h-full object-cover -z-10"
    >
      <source src="video/demo.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};
